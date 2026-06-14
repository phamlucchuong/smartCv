# P0 — Notification Application Events + Dockerfiles

## Scope

Three blocking items that must be completed before production deployment:

1. **R1** — Notification service consumes `application.accepted/rejected/withdrawn` events
2. **R2** — Dockerfiles for all 6 application services
3. **R3** — `ai_engine_service` + Ollama added to `docker-compose.prod.yaml`

---

## Current assessment

- `application_service` already publishes to `application.exchange` (direct) with routing keys
  `application.accepted`, `application.rejected`, `application.withdrawn`.
- `notification-service` (Go) currently only consumes `otp.queue` via `notification.exchange`.
  Application events are published but never consumed — candidates do not receive outcome emails.
- No `Dockerfile` exists in any service directory. `docker-compose.prod.yaml` references images
  like `smartcv/api-gateway:latest` but those images cannot be built without Dockerfiles.
- `ai_engine_service` (port 8085) is running in dev but absent from `docker-compose.prod.yaml`;
  Ollama is also not defined.

---

## R1 — Notification service: consume application events

### R1.1 — Enrich `ApplicationEventMessage` in application_service

The notification service needs the candidate's email to send the outcome email, but
`ApplicationEventMessage` currently only carries `candidateId`. The simplest fix: add
`candidateEmail` and `jobTitle` to the published message at the point where the
application_service already has this context (on status update and withdraw).

**Add `UserClient` to application_service:**

File: `application_service/src/main/java/.../integration/user/UserClient.java`
```java
@Component
@RequiredArgsConstructor
@Slf4j
public class UserClient {
    final RestTemplate restTemplate;

    @Value("${app.user-service.base-url}")
    String baseUrl;

    public String getCandidateEmail(String candidateId) {
        try {
            ResponseEntity<ApiResponse<UserSummary>> resp = restTemplate.exchange(
                baseUrl + "/api/users/" + candidateId, HttpMethod.GET, null,
                new ParameterizedTypeReference<>() {});
            UserSummary user = Objects.requireNonNull(resp.getBody()).getData();
            return user != null ? user.getEmail() : null;
        } catch (Exception e) {
            log.warn("Failed to fetch candidate email for {}: {}", candidateId, e.getMessage());
            return null;
        }
    }
}
```

File: `application_service/src/main/java/.../integration/user/UserSummary.java`
```java
public record UserSummary(String id, String email, String fullName) {}
```

**Add `app.user-service.base-url` to `application.yaml`:**
```yaml
app:
  user-service:
    base-url: ${USER_SERVICE_URL:http://localhost:8081/user}
```

**Update `ApplicationEventMessage`** — add two fields:
```java
String candidateEmail;   // looked up from user-service at publish time
String jobTitle;         // not currently stored in Application — fetch from JobClient or store denormalized
```

**Simplest approach for `jobTitle`**: store `jobTitle` in `Application` entity at submit time
(already calls `JobClient.getActiveJob()` — just capture `job.getTitle()`), so no extra HTTP
call at notification publish time.

**Update `NotificationPublisher.publishStatusChanged()`** to set these two fields:
```java
.candidateEmail(application.getCandidateEmail())  // new field on Application entity
.jobTitle(application.getJobTitle())              // new field on Application entity
```

**Summary of changes in application_service:**

| File | Change |
|------|--------|
| `Application.java` | Add `candidateEmail` (String), `jobTitle` (String) |
| `ApplicationService.submit()` | Set `candidateEmail` from `UserClient`, `jobTitle` from `JobResponse.getTitle()` |
| `integration/user/UserClient.java` | New file — HTTP call to user-service |
| `integration/user/UserSummary.java` | New file — minimal DTO |
| `ApplicationEventMessage.java` | Add `candidateEmail`, `jobTitle` fields |
| `application.yaml` | Add `app.user-service.base-url` |

---

### R1.2 — Notification service consumer (Go)

**File to modify:** `notification-service/internal/notification/consumer.go`

Add a new `ListenApplicationEvents()` method alongside the existing `Listen()` (OTP):

```go
type ApplicationEventMessage struct {
    ApplicationID  string `json:"applicationId"`
    CandidateID    string `json:"candidateId"`
    CandidateEmail string `json:"candidateEmail"`
    RecruiterID    string `json:"recruiterId"`
    JobID          string `json:"jobId"`
    JobTitle       string `json:"jobTitle"`
    NewStatus      string `json:"newStatus"`
    RejectionReason string `json:"rejectionReason,omitempty"`
    OccurredAt     string `json:"occurredAt"`
}

func (c *Consumer) ListenApplicationEvents() error {
    ch, err := c.conn.Channel()
    if err != nil {
        return err
    }

    err = ch.ExchangeDeclare(
        "application.exchange", "direct", true, false, false, false, nil,
    )
    if err != nil {
        return err
    }

    queues := []struct {
        name       string
        routingKey string
    }{
        {"application.accepted.queue",  "application.accepted"},
        {"application.rejected.queue",  "application.rejected"},
        {"application.withdrawn.queue", "application.withdrawn"},
    }

    var allMsgs []<-chan amqp.Delivery
    for _, q := range queues {
        queue, err := ch.QueueDeclare(q.name, true, false, false, false, nil)
        if err != nil {
            return err
        }
        if err = ch.QueueBind(queue.Name, q.routingKey, "application.exchange", false, nil); err != nil {
            return err
        }
        msgs, err := ch.Consume(queue.Name, "", true, false, false, false, nil)
        if err != nil {
            return err
        }
        allMsgs = append(allMsgs, msgs)
    }

    for _, msgs := range allMsgs {
        go func(deliveries <-chan amqp.Delivery) {
            for d := range deliveries {
                var msg ApplicationEventMessage
                if err := json.Unmarshal(d.Body, &msg); err != nil {
                    c.logger.Error("failed to unmarshal application event", "error", err)
                    continue
                }
                c.handleApplicationEvent(msg)
            }
        }(msgs)
    }

    c.logger.Info("RabbitMQ consumer listening on application event queues")
    return nil
}

func (c *Consumer) handleApplicationEvent(msg ApplicationEventMessage) {
    if msg.CandidateEmail == "" {
        c.logger.Warn("application event missing candidateEmail, skipping", "applicationId", msg.ApplicationID)
        return
    }

    c.logger.Info("processing application event",
        "applicationId", msg.ApplicationID, "status", msg.NewStatus)

    ctx := context.Background()
    if err := c.notiSvc.SendApplicationResultEmail(ctx, msg); err != nil {
        c.logger.Error("failed to send application result email",
            "applicationId", msg.ApplicationID, "error", err)
    }
}
```

**Call `ListenApplicationEvents()` in `server.go`** alongside existing `consumer.Listen()`:
```go
if err := s.consumer.ListenApplicationEvents(); err != nil {
    log.Error("failed to start application event consumer", slog.Any("error", err))
}
```

---

### R1.3 — Email template + send method

**New template file:** `notification-service/internal/platform/email/templates/application_result.html`

Minimum viable HTML template — mirrors the OTP template pattern:
```html
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h2>Kết quả ứng tuyển — SmartCV</h2>
  <p>Xin chào,</p>
  <p>Đơn ứng tuyển của bạn cho vị trí <strong>{{.JobTitle}}</strong> đã được cập nhật:</p>

  {{if eq .Status "ACCEPTED"}}
  <div style="background:#d4edda;border-left:4px solid #28a745;padding:15px;margin:20px 0">
    <strong style="color:#155724">Chúc mừng! Đơn của bạn đã được CHẤP NHẬN.</strong>
  </div>
  {{else if eq .Status "REJECTED"}}
  <div style="background:#f8d7da;border-left:4px solid #dc3545;padding:15px;margin:20px 0">
    <strong style="color:#721c24">Đơn của bạn chưa phù hợp lần này.</strong>
    {{if .RejectionReason}}
    <p style="margin-top:10px">Lý do: {{.RejectionReason}}</p>
    {{end}}
  </div>
  {{else if eq .Status "WITHDRAWN"}}
  <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0">
    <strong style="color:#856404">Đơn ứng tuyển đã được RÚT LẠI.</strong>
  </div>
  {{end}}

  <p>Trân trọng,<br/>Đội ngũ SmartCV</p>
</body>
</html>
```

**Update `templates.go`** — add `applicationResultTemplate` and `renderApplicationResultEmail()`:
```go
var applicationResultTemplate = template.Must(
    template.ParseFS(templateFS, "templates/application_result.html"))

type applicationResultData struct {
    JobTitle        string
    Status          string
    RejectionReason string
}

func renderApplicationResultEmail(jobTitle, status, rejectionReason string) (htmlBody, plain string) {
    plain = fmt.Sprintf("Kết quả ứng tuyển %s: %s", jobTitle, status)
    if rejectionReason != "" {
        plain += "\nLý do: " + rejectionReason
    }

    var buf bytes.Buffer
    data := applicationResultData{JobTitle: jobTitle, Status: status, RejectionReason: rejectionReason}
    if err := applicationResultTemplate.Execute(&buf, data); err != nil {
        return plain, plain
    }
    return buf.String(), plain
}
```

**Add `SendApplicationResult(ctx, to, jobTitle, status, rejectionReason string) error`** to
`email.Service` interface and implementation:
```go
func (s *emailService) SendApplicationResult(ctx context.Context, to, jobTitle, status, rejectionReason string) error {
    return s.provider.SendApplicationResult(ctx, to, jobTitle, status, rejectionReason)
}
```

**Add `SendApplicationResultEmail()` to `notification.Service`:**
```go
func (s *Service) SendApplicationResultEmail(ctx context.Context, msg ApplicationEventMessage) error {
    subject := fmt.Sprintf("Kết quả ứng tuyển: %s", msg.JobTitle)
    _ = subject
    return s.emailService.SendApplicationResult(ctx,
        msg.CandidateEmail, msg.JobTitle, msg.NewStatus, msg.RejectionReason)
}
```

Add `SendApplicationResultEmail(ctx context.Context, msg ApplicationEventMessage) error` to
`ServiceInterface`.

---

### R1 file summary

| Service | File | Action |
|---------|------|--------|
| `application_service` | `Application.java` | Add `candidateEmail`, `jobTitle` fields |
| `application_service` | `ApplicationService.java` | Set new fields in `submit()` |
| `application_service` | `integration/user/UserClient.java` | New |
| `application_service` | `integration/user/UserSummary.java` | New |
| `application_service` | `ApplicationEventMessage.java` | Add `candidateEmail`, `jobTitle` |
| `application_service` | `application.yaml` | Add `app.user-service.base-url` |
| `notification-service` | `consumer.go` | Add `ListenApplicationEvents()`, `handleApplicationEvent()` |
| `notification-service` | `service.go` | Add `SendApplicationResultEmail()` |
| `notification-service` | `platform/email/templates.go` | Add template + render function |
| `notification-service` | `platform/email/templates/application_result.html` | New |
| `notification-service` | `platform/email/email.go` | Add `SendApplicationResult()` to interface |
| `notification-service` | `server.go` | Call `consumer.ListenApplicationEvents()` |

---

## R2 — Dockerfiles for all 6 services

### Java services (api-gateway, user-service, job_service, application_service, ai_engine_service)

Same multi-stage pattern for all five. Create one file per service:

**`<service-dir>/Dockerfile`:**
```dockerfile
FROM maven:3.9-amazoncorretto-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE <PORT>
ENTRYPOINT ["java", "-jar", "app.jar"]
```

| Service | Directory | EXPOSE |
|---------|-----------|--------|
| api-gateway | `api-gateway/` | 8080 |
| user-service | `user-service/` | 8081 |
| job_service | `job_service/` | 8082 |
| application_service | `application_service/` | 8083 |
| ai_engine_service | `ai_engine_service/` | 8085 |

### Go service (notification-service)

**`notification-service/Dockerfile`:**
```dockerfile
FROM golang:1.25-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o notification-service ./cmd/server

FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=build /app/notification-service .
EXPOSE 8084
ENTRYPOINT ["./notification-service"]
```

**`.dockerignore`** (create in each service root to speed up builds):
```
target/
.mvn/
*.md
.git
```

---

## R3 — Add ai_engine_service + Ollama to docker-compose.prod.yaml

### Ollama service

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: smartCv-ollama
  restart: unless-stopped
  volumes:
    - ollama_data:/root/.ollama
  ports:
    - "11434:11434"
  environment:
    - OLLAMA_HOST=0.0.0.0
  networks:
    - smartCv-net
```

Pull Llama 3.2 model as a one-time init step:
```yaml
ollama-init:
  image: ollama/ollama:latest
  container_name: smartCv-ollama-init
  restart: "no"
  volumes:
    - ollama_data:/root/.ollama
  depends_on:
    - ollama
  entrypoint: ["sh", "-c", "sleep 5 && ollama pull llama3.2"]
  networks:
    - smartCv-net
```

### ai_engine_service entry

```yaml
ai-engine-service:
  image: ${AI_SERVICE_IMAGE:-smartcv/ai-engine-service:latest}
  container_name: smartCv-ai-engine-service
  restart: unless-stopped
  env_file:
    - .env
  environment:
    OLLAMA_BASE_URL: http://ollama:11434
    JOB_SERVICE_URL: http://job-service:8082/job
    GATEWAY_INTERNAL_SECRET: ${GATEWAY_INTERNAL_SECRET}
  depends_on:
    - ollama
    - job-service
  networks:
    - smartCv-net
```

### Add to volumes section

```yaml
volumes:
  ...
  ollama_data:
```

### Add `ai-engine-service` to api-gateway `depends_on`

```yaml
api-gateway:
  depends_on:
    - user-service
    - job-service
    - application-service
    - notification-service
    - ai-engine-service    # add this
    - redis
```

### `.env.example` additions

```
AI_SERVICE_IMAGE=smartcv/ai-engine-service:latest
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2
```

---

## Execution order

```
R3    docker-compose.prod.yaml (ai + ollama)           ~1 hour  (no code changes)
R2    Dockerfiles (6 files, same pattern)              ~2 hours (mechanical)
R1.3  Email template + send method in notification     ~2 hours
R1.2  Consumer Go code                                 ~2 hours
R1.1  Enrich ApplicationEventMessage (Java)            ~3 hours (UserClient + entity changes)

Total                                                  ~10 hours / ~1.5 days
```

**Recommended order:** R3 → R2 → R1 (R3 and R2 are mechanical with no business logic risk;
R1 has cross-service changes that need careful testing.)
