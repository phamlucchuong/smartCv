# AI Multi-Provider Gateway — DB-Backed Dynamic Config

**Date:** 2026-06-12
**Branch:** `feat/ai-multi-provider`
**Service:** `ai_engine_service`
**Replaces:** `plans/issues/20260602_1500_ai-multi-provider-gateway.md` (env-var approach — superseded)

---

## Goal

Replace hardcoded, env-var-only AI provider config with a MongoDB-backed system where admins
configure provider credentials via API and switch the active provider at runtime. The service
dynamically instantiates the `ChatModel` for whichever provider is active.

---

## Architecture

```
MongoDB: ai_provider_configs
    ↓  on startup: load active=true doc
    ↓  on activate: load doc for requested provider
AiModelGatewayFactory
    ↓  creates programmatically
AiModelGateway (interface)     ← GroqModelGateway | AzureOpenAiModelGateway
                                  AnthropicModelGateway | GeminiModelGateway
    ↓  held by
AiModelGatewayRouter (@Component)
    ↓  delegate call()
AnalysisService                ← unchanged beyond swapping ChatClient → AiModelGatewayRouter
```

**Startup:** router queries DB for `active=true`; if found, creates the gateway and sets it as
active. If none found, router starts in unconfigured state — AI calls fail with
`PROVIDER_NOT_CONFIGURED` until admin activates a provider via API.

**Switch flow:**
1. Admin: `PUT /api/ai/admin/providers/{provider}/activate`
2. Controller loads `AiProviderConfig` from DB
3. `AiModelGatewayFactory.create(config)` → gateway instance
4. Router replaces active gateway (volatile field)
5. DB: unset `active` on all docs, set `active=true` on new provider

---

## Data Model

### `AiProviderConfig` — MongoDB document (`ai_provider_configs` collection)

```java
@Document("ai_provider_configs")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiProviderConfig {
    @Id String id;

    @Indexed(unique = true)
    AiProvider provider;      // unique per provider type

    String apiKey;            // sensitive — stored plain; one doc per provider type
    String model;             // e.g. gemini-1.5-flash, claude-sonnet-4-6, llama-3.1-8b-instant
    String baseUrl;           // Groq: https://api.groq.com/openai
                              // Azure: https://{resource}.openai.azure.com
                              // Gemini: https://generativelanguage.googleapis.com/v1beta/openai
                              // Anthropic: null (Spring AI hardcodes endpoint)
    String deploymentName;    // Azure only; null for all others
    boolean active;           // only one doc should have active=true at any time
    LocalDateTime updatedAt;
}
```

`apiKey` is stored plain in this scope. Encryption at rest (AES-256-GCM with a master key from
env) is recommended before production but is out of scope for this plan.

### `AiProvider` enum

```java
public enum AiProvider {
    GROQ, AZURE_OPENAI, ANTHROPIC, GEMINI;

    public static AiProvider from(String value) {
        return switch (value.trim().toLowerCase()) {
            case "groq"                              -> GROQ;
            case "azure", "azure_openai", "azure-openai" -> AZURE_OPENAI;
            case "anthropic", "claude"               -> ANTHROPIC;
            case "gemini", "google", "google_gemini" -> GEMINI;
            default -> throw new IllegalArgumentException("Unknown AI provider: " + value);
        };
    }
}
```

### `AiProviderConfigRepository`

```java
public interface AiProviderConfigRepository extends MongoRepository<AiProviderConfig, String> {
    Optional<AiProviderConfig> findByProvider(AiProvider provider);
    Optional<AiProviderConfig> findByActiveTrue();
}
```

---

## Core Classes

### `AiModelGateway` (interface)

```java
public interface AiModelGateway {
    String call(String systemPrompt, String userPrompt);
    AiProvider provider();
}
```

### Four implementations

Each implementation wraps a Spring AI `ChatModel`. Groq and Gemini both use OpenAI-compatible
endpoints and wrap `OpenAiChatModel` — they differ only in `provider()`.

```java
// GroqModelGateway
public class GroqModelGateway implements AiModelGateway {
    private final OpenAiChatModel chatModel;
    public String call(String sys, String user) {
        return ChatClient.builder(chatModel).build().prompt().system(sys).user(user).call().content();
    }
    public AiProvider provider() { return AiProvider.GROQ; }
}

// GeminiModelGateway  — identical structure, different provider()
public class GeminiModelGateway implements AiModelGateway {
    private final OpenAiChatModel chatModel;
    public String call(String sys, String user) { ... same ... }
    public AiProvider provider() { return AiProvider.GEMINI; }
}

// AnthropicModelGateway
public class AnthropicModelGateway implements AiModelGateway {
    private final AnthropicChatModel chatModel;
    public String call(String sys, String user) {
        return ChatClient.builder(chatModel).build().prompt().system(sys).user(user).call().content();
    }
    public AiProvider provider() { return AiProvider.ANTHROPIC; }
}

// AzureOpenAiModelGateway
public class AzureOpenAiModelGateway implements AiModelGateway {
    private final AzureOpenAiChatModel chatModel;
    public String call(String sys, String user) { ... same ... }
    public AiProvider provider() { return AiProvider.AZURE_OPENAI; }
}
```

None are `@Component` — all created via factory.

### `AiModelGatewayFactory`

Knows how to construct each `ChatModel` programmatically from a `AiProviderConfig`.
No Spring Boot auto-configuration is used for model beans — everything is explicit.

```java
@Component
public class AiModelGatewayFactory {

    public AiModelGateway create(AiProviderConfig config) {
        return switch (config.getProvider()) {
            case GROQ     -> buildGroq(config);
            case GEMINI   -> buildGemini(config);
            case AZURE_OPENAI -> buildAzure(config);
            case ANTHROPIC    -> buildAnthropic(config);
        };
    }

    private GroqModelGateway buildGroq(AiProviderConfig c) {
        OpenAiApi api = OpenAiApi.builder()
                .baseUrl(c.getBaseUrl())
                .apiKey(c.getApiKey())
                .build();
        OpenAiChatModel model = OpenAiChatModel.builder()
                .openAiApi(api)
                .defaultOptions(OpenAiChatOptions.builder()
                        .model(c.getModel()).temperature(0.2).build())
                .build();
        return new GroqModelGateway(model);
    }

    private GeminiModelGateway buildGemini(AiProviderConfig c) {
        // Gemini exposes OpenAI-compatible endpoint — no extra starter needed
        OpenAiApi api = OpenAiApi.builder()
                .baseUrl(c.getBaseUrl()) // https://generativelanguage.googleapis.com/v1beta/openai
                .apiKey(c.getApiKey())
                .build();
        OpenAiChatModel model = OpenAiChatModel.builder()
                .openAiApi(api)
                .defaultOptions(OpenAiChatOptions.builder()
                        .model(c.getModel()).temperature(0.2).build())
                .build();
        return new GeminiModelGateway(model);
    }

    private AzureOpenAiModelGateway buildAzure(AiProviderConfig c) {
        OpenAIClientBuilder builder = new OpenAIClientBuilder()
                .credential(new AzureKeyCredential(c.getApiKey()))
                .endpoint(c.getBaseUrl());
        AzureOpenAiChatModel model = AzureOpenAiChatModel.builder()
                .openAIClientBuilder(builder)
                .defaultOptions(AzureOpenAiChatOptions.builder()
                        .deploymentName(c.getDeploymentName())
                        .temperature(0.2)
                        .build())
                .build();
        return new AzureOpenAiModelGateway(model);
    }

    private AnthropicModelGateway buildAnthropic(AiProviderConfig c) {
        AnthropicApi api = new AnthropicApi(c.getApiKey());
        AnthropicChatModel model = AnthropicChatModel.builder()
                .anthropicApi(api)
                .defaultOptions(AnthropicChatOptions.builder()
                        .model(c.getModel())
                        .temperature(0.2f)
                        .maxTokens(4096)
                        .build())
                .build();
        return new AnthropicModelGateway(model);
    }
}
```

### `AiModelGatewayRouter`

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class AiModelGatewayRouter {

    private final AiProviderConfigRepository repository;
    private final AiModelGatewayFactory factory;

    private volatile AiModelGateway activeGateway;  // null = unconfigured

    @PostConstruct
    void init() {
        repository.findByActiveTrue().ifPresentOrElse(
            config -> {
                activeGateway = factory.create(config);
                log.info("AI gateway initialized with provider: {}", config.getProvider());
            },
            () -> log.warn("No active AI provider configured. AI calls will fail until an admin activates a provider.")
        );
    }

    public String call(String systemPrompt, String userPrompt) {
        AiModelGateway gateway = activeGateway;
        if (gateway == null) throw new AppException(ErrorCode.PROVIDER_NOT_CONFIGURED);
        return gateway.call(systemPrompt, userPrompt);
    }

    public void activate(AiProviderConfig config) {
        AiModelGateway gateway = factory.create(config);
        // persist active flag
        repository.findByActiveTrue().ifPresent(current -> {
            current.setActive(false);
            repository.save(current);
        });
        config.setActive(true);
        config.setUpdatedAt(LocalDateTime.now());
        repository.save(config);
        // atomic swap
        activeGateway = gateway;
        log.info("AI provider switched to: {}", config.getProvider());
    }

    public String getActiveProvider() {
        AiModelGateway gateway = activeGateway;
        return gateway == null ? "none" : gateway.provider().name().toLowerCase();
    }
}
```

`volatile` on `activeGateway` ensures visibility across threads. In-flight calls complete on the
old gateway — both the old and new `ChatModel` instances are alive; no call is dropped.

---

## Admin API

**Package:** `features/admin/`

### Request / Response DTOs

```java
// PUT request body
class AiProviderConfigRequest {
    AiProvider provider;       // required
    String apiKey;             // required on create; null = keep existing on update
    String model;              // required
    String baseUrl;            // required for GROQ, AZURE_OPENAI, GEMINI; null for ANTHROPIC
    String deploymentName;     // required for AZURE_OPENAI; null for others
}

// Response (apiKey always hidden)
class AiProviderConfigResponse {
    AiProvider provider;
    String model;
    String baseUrl;
    String deploymentName;
    boolean active;
    boolean configured;        // true if apiKey is stored; does not expose the key
    LocalDateTime updatedAt;
}
```

### Controller endpoints

```
GET    /api/ai/admin/providers                     → List<AiProviderConfigResponse>
PUT    /api/ai/admin/providers/{provider}           → AiProviderConfigResponse  (upsert)
DELETE /api/ai/admin/providers/{provider}           → void  (forbidden if provider is active)
PUT    /api/ai/admin/providers/{provider}/activate  → AiProviderConfigResponse
GET    /api/ai/admin/providers/active               → AiProviderConfigResponse
```

All endpoints require `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`.

`DELETE` throws `PROVIDER_ACTIVE` (new error code) if the target provider is currently active.

### `AiAdminController`

```java
@RestController
@RequestMapping("/api/ai/admin/providers")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AiAdminController {

    private final AiProviderConfigRepository repository;
    private final AiModelGatewayRouter router;
    private final AiAdminService adminService;

    @GetMapping
    public ApiResponse<List<AiProviderConfigResponse>> listProviders() { ... }

    @PutMapping("/{provider}")
    public ApiResponse<AiProviderConfigResponse> upsertProvider(
            @PathVariable String provider,
            @RequestBody AiProviderConfigRequest request) { ... }

    @DeleteMapping("/{provider}")
    public ApiResponse<Void> deleteProvider(@PathVariable String provider) { ... }

    @PutMapping("/{provider}/activate")
    public ApiResponse<AiProviderConfigResponse> activateProvider(@PathVariable String provider) { ... }

    @GetMapping("/active")
    public ApiResponse<AiProviderConfigResponse> getActiveProvider() { ... }
}
```

Business logic (upsert, validate request fields per provider type, guard delete-while-active)
lives in `AiAdminService` — controller stays thin.

---

## Error Codes (additions to `ErrorCode.java`)

```java
PROVIDER_NOT_CONFIGURED(8007, "No AI provider is configured or active"),
PROVIDER_NOT_FOUND(8008, "AI provider config not found"),
PROVIDER_ACTIVE(8009, "Cannot delete the currently active provider"),
```

---

## Dependencies (`pom.xml` additions)

```xml
<!-- Azure OpenAI -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-azure-openai</artifactId>
</dependency>

<!-- Anthropic (Claude) -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-anthropic</artifactId>
</dependency>

<!-- Gemini: uses OpenAI-compatible endpoint — NO new starter needed.
     spring-ai-starter-model-openai already in pom covers Gemini too. -->
```

`spring-ai-starter-model-openai` already present covers both Groq and Gemini.
All versions managed by existing `spring-ai-bom` at `1.1.5`.

---

## `application.yaml` changes

Remove the hardcoded `spring.ai.openai` block (no longer needed — config comes from DB).
Keep only infrastructure config and app-level properties:

```yaml
# Remove:
# spring.ai.openai.*          ← replaced by DB config
# app.ai.provider             ← replaced by active flag in DB

# Keep:
app:
  ai:
    recommend-batch-size: ${AI_RECOMMEND_BATCH:20}
```

`.env.example`: remove `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_PROVIDER`. Add comment block:

```
# AI providers are now configured via the Admin API (PUT /api/ai/admin/providers/{provider}).
# No credentials are required in .env. Use the API to add keys after the service starts.
```

---

## Startup Behavior

| DB state on startup | Behavior |
|---------------------|----------|
| One doc with `active=true` | Gateway created, service fully operational |
| Multiple docs with `active=true` | Use `findByActiveTrue()` (returns first); log warning about inconsistent state |
| No docs / no active doc | `activeGateway = null`; AI calls return `PROVIDER_NOT_CONFIGURED(8007)` until admin activates |

---

## Testing

### Unit tests (Mockito, no Spring context)

| File | Tests |
|------|-------|
| `AiProviderTest` | `from()` valid aliases for all 4 providers; unknown input throws |
| `AiModelGatewayFactoryTest` | Each provider creates correct gateway type; assert `gateway.provider()` |
| `AiModelGatewayRouterTest` | `init()` with active config → gateway set; `init()` with no active → null; `call()` with null gateway throws; `activate()` swaps gateway and persists; `getActiveProvider()` returns "none" when null |

### Integration / slice tests

| File | Tests |
|------|-------|
| `AiAdminControllerTest` (`@WebMvcTest`) | ROLE_ADMIN can upsert/activate/delete/list; ROLE_CANDIDATE gets 403; delete active provider returns error |
| `AiAdminServiceTest` | upsert creates new doc; upsert updates existing (keeps apiKey if null); activate calls router; delete active throws |

---

## File Structure (new files only)

```
ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/
├── model/
│   ├── AiProvider.java
│   ├── AiModelGateway.java
│   ├── AiModelGatewayFactory.java
│   ├── AiModelGatewayRouter.java
│   ├── GroqModelGateway.java
│   ├── GeminiModelGateway.java
│   ├── AnthropicModelGateway.java
│   └── AzureOpenAiModelGateway.java
├── features/admin/
│   ├── AiAdminController.java
│   ├── AiAdminService.java
│   ├── AiProviderConfig.java         (MongoDB document)
│   ├── AiProviderConfigRepository.java
│   ├── AiProviderConfigRequest.java
│   └── AiProviderConfigResponse.java
└── enums/
    └── ErrorCode.java               (modified — 3 new entries)

ai_engine_service/src/test/java/vn/chuongpl/ai_engine_service/
├── model/
│   ├── AiProviderTest.java
│   ├── AiModelGatewayFactoryTest.java
│   └── AiModelGatewayRouterTest.java
└── features/admin/
    ├── AiAdminControllerTest.java
    └── AiAdminServiceTest.java
```

**Modified files:**
- `pom.xml` — add 2 starters (Azure, Anthropic)
- `config/AiConfig.java` — delete entire file (replaced by `AiModelGatewayFactory`)
- `features/analysis/AnalysisService.java` — replace `ChatClient` field with `AiModelGatewayRouter`; rewrite `callAi()`
- `src/main/resources/application.yaml` — remove `spring.ai.openai.*` block
- `.env.example` — remove AI_* credential vars, add comment

---

## Out of Scope

- API key encryption at rest (recommended before production — use AES-256-GCM with `AI_KEY_ENCRYPTION_SECRET` env var)
- Per-user provider selection (all users share the globally active provider)
- Provider health-check / auto-fallback (if active provider errors, no automatic switch)
- Model listing per provider (admin must know valid model names for their provider)
- Audit log for provider switches
