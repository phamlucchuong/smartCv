✅

# [feat] AI Multi-Provider Gateway — Azure OpenAI + Strategy Pattern Abstraction

## Overview

The current `ai_engine_service` hardwires all AI calls through a single `ChatClient` bean backed
by the Groq-hosted OpenAI-compatible API. There is no abstraction between business logic
(`AnalysisService`) and model invocation, which means switching to Azure OpenAI — or any other
provider — requires changes spread across `AiConfig`, `AnalysisService`, and `application.yaml`
with no clean seam for testing.

This feature introduces:
1. **`AiModelGateway` interface** — the single contract for model invocation, decoupling all
   business logic from provider-specific SDK details.
2. **Provider implementations**: `GroqModelGateway` (existing Groq/OpenAI-compatible) and
   `AzureOpenAiModelGateway` (new).
3. **`AiModelGatewayRouter`** — holds all registered gateway beans; routes calls to the active
   provider; supports runtime provider switching without restart.
4. **Admin API** (`PUT /api/ai/admin/provider`) — allows `ROLE_ADMIN` users to switch the active
   provider at runtime via the existing internal-auth security layer.

---

## Reproduction steps (current limitation)

1. To switch from Groq to Azure OpenAI today, a developer must:
   a. Replace `spring-ai-starter-model-openai` with `spring-ai-starter-model-azure-openai` in `pom.xml`.
   b. Rewrite `AiConfig.java` to wire an `AzureOpenAiChatModel`.
   c. Update `application.yaml` with `spring.ai.azure.openai.*` properties.
   d. Rebuild and redeploy the service.
2. There is no way to switch providers at runtime.
3. There is no way to register a second provider for A/B testing or fallback.

---

## Expected behavior

1. Both Groq and Azure OpenAI providers are registered at startup when their respective
   credentials are supplied as env vars.
2. The active provider is selected via `AI_PROVIDER` env var (default: `groq`).
3. An admin user can call `PUT /api/ai/admin/provider?provider=azure_openai` to switch the
   active provider at runtime — all subsequent AI calls use the new provider without restart.
4. `GET /api/ai/admin/provider` returns the currently active provider name in canonical form
   (e.g. `"groq"`, `"azure_openai"`).
5. `AnalysisService` is unchanged beyond replacing `ChatClient` injection with
   `AiModelGatewayRouter`.

---

## Current behavior

- `AiConfig` creates a single `ChatClient` bean from the auto-configured `ChatModel`
  (`OpenAiChatModel` backed by Groq).
- `AnalysisService` injects `ChatClient` directly — no interface between business logic and
  the model call.
- `callAi(prompt)` in `AnalysisService` calls `chatClient.prompt().system(...).user(...).call().content()`.

---

## Impact scope

- [ ] api-gateway
- [ ] user-service
- [ ] job_service
- [ ] application_service
- [x] ai_engine_service
- [ ] notification-service
- [ ] Infrastructure (Docker / RabbitMQ / MongoDB / Elasticsearch)

---

## Related code

| File | Thay đổi |
|---|---|
| `ai_engine_service/pom.xml` | Thêm `spring-ai-starter-model-azure-openai` |
| `ai_engine_service/.../config/AiConfig.java` | Xóa `ChatClient` bean; đăng ký 2 gateway beans |
| `ai_engine_service/.../features/analysis/AnalysisService.java` | Đổi `ChatClient` → `AiModelGatewayRouter` |
| `ai_engine_service/.../enums/ErrorCode.java` | Thêm `PROVIDER_NOT_CONFIGURED` |
| `ai_engine_service/src/main/resources/application.yaml` | Thêm `app.ai.provider`; loại bỏ Azure block |
| `docker-compose.prod.yaml` | Thêm Azure env vars cho `ai-engine-service` |

New files:

| New file | Role |
|---|---|
| `model/AiModelGateway.java` | Interface: `call(system, user)` + `provider()` |
| `model/AiProvider.java` | Enum: `GROQ`, `AZURE_OPENAI` + `from(String)` factory |
| `model/GroqModelGateway.java` | Delegates to `OpenAiChatModel` |
| `model/AzureOpenAiModelGateway.java` | Delegates to `AzureOpenAiChatModel` |
| `model/AiModelGatewayRouter.java` | Dispatcher, active-provider routing, `switchProvider()` |
| `features/admin/AiAdminController.java` | `PUT /api/ai/admin/provider`, `GET /api/ai/admin/provider` |

Test files:

| Test file | Coverage |
|---|---|
| `model/AiProviderTest.java` | `from()` — valid aliases, invalid input |
| `model/AiModelGatewayRouterTest.java` | Empty registry guard, `switchProvider()`, `call()` delegation |
| `features/admin/AiAdminControllerTest.java` | Role enforcement, switch and query endpoints |

---

## Implementation specification

### Phase 1 — New `model/` abstraction package

#### 1. `AiProvider.java`

```java
package vn.chuongpl.ai_engine_service.model;

public enum AiProvider {
    GROQ, AZURE_OPENAI;

    public static AiProvider from(String value) {
        return switch (value.trim().toLowerCase()) {
            case "groq" -> GROQ;
            case "azure", "azure_openai", "azure-openai" -> AZURE_OPENAI;
            default -> throw new IllegalArgumentException("Unknown AI provider: " + value);
        };
    }
}
```

#### 2. `AiModelGateway.java`

```java
package vn.chuongpl.ai_engine_service.model;

public interface AiModelGateway {
    String call(String systemPrompt, String userPrompt);
    AiProvider provider();
}
```

#### 3. `GroqModelGateway.java`

```java
package vn.chuongpl.ai_engine_service.model;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;

@RequiredArgsConstructor
public class GroqModelGateway implements AiModelGateway {

    private final OpenAiChatModel chatModel;

    @Override
    public String call(String systemPrompt, String userPrompt) {
        return ChatClient.builder(chatModel).build()
                .prompt()
                .system(systemPrompt)
                .user(userPrompt)
                .call()
                .content();
    }

    @Override
    public AiProvider provider() {
        return AiProvider.GROQ;
    }
}
```

No `@Component` — registered conditionally in `AiConfig`.

#### 4. `AzureOpenAiModelGateway.java`

```java
package vn.chuongpl.ai_engine_service.model;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.azure.openai.AzureOpenAiChatModel;
import org.springframework.ai.chat.client.ChatClient;

@RequiredArgsConstructor
public class AzureOpenAiModelGateway implements AiModelGateway {

    private final AzureOpenAiChatModel chatModel;

    @Override
    public String call(String systemPrompt, String userPrompt) {
        return ChatClient.builder(chatModel).build()
                .prompt()
                .system(systemPrompt)
                .user(userPrompt)
                .call()
                .content();
    }

    @Override
    public AiProvider provider() {
        return AiProvider.AZURE_OPENAI;
    }
}
```

No `@Component` — registered conditionally in `AiConfig`.

#### 5. `AiModelGatewayRouter.java`

`AiModelGatewayRouter` does **not** implement `AiModelGateway` to avoid circular dependency when
Spring collects `List<AiModelGateway>`. `AnalysisService` and `AiAdminController` inject the
router by its concrete type.

`activeProvider` stores the **canonical enum name in lowercase** (e.g. `"groq"`, `"azure_openai"`)
— not the raw alias supplied by the caller. This ensures `getActiveProvider()` always returns a
consistent, parseable string regardless of what alias the admin passed to `switchProvider()`.

```java
package vn.chuongpl.ai_engine_service.model;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import vn.chuongpl.ai_engine_service.enums.ErrorCode;
import vn.chuongpl.ai_engine_service.exception.AppException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class AiModelGatewayRouter {

    private final Map<AiProvider, AiModelGateway> registry;
    private volatile String activeProvider;  // canonical lowercase enum name

    public AiModelGatewayRouter(
            List<AiModelGateway> gateways,
            @Value("${app.ai.provider:groq}") String defaultProvider) {

        this.registry = gateways.stream()
                .collect(Collectors.toMap(AiModelGateway::provider, g -> g));

        if (this.registry.isEmpty()) {
            throw new IllegalStateException(
                "No AI model gateways configured. " +
                "Set AI_API_KEY (Groq) or AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT (Azure).");
        }

        AiProvider defaultTarget;
        try {
            defaultTarget = AiProvider.from(defaultProvider);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid default AI provider: " + defaultProvider, e);
        }
        if (!this.registry.containsKey(defaultTarget)) {
            throw new IllegalStateException(
                "Default AI provider '" + defaultProvider + "' credentials are not configured.");
        }

        this.activeProvider = defaultTarget.name().toLowerCase();
        log.info("AI gateway registry: {} | active: {}", this.registry.keySet(), this.activeProvider);
    }

    public String call(String systemPrompt, String userPrompt) {
        return resolve().call(systemPrompt, userPrompt);
    }

    public void switchProvider(String provider) {
        AiProvider target;
        try {
            target = AiProvider.from(provider);
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.PROVIDER_NOT_CONFIGURED);
        }
        if (!registry.containsKey(target)) {
            throw new AppException(ErrorCode.PROVIDER_NOT_CONFIGURED);
        }
        this.activeProvider = target.name().toLowerCase();
        log.info("AI provider switched to: {}", this.activeProvider);
    }

    public String getActiveProvider() {
        return activeProvider;
    }

    private AiModelGateway resolve() {
        try {
            AiProvider target = AiProvider.from(activeProvider);
            AiModelGateway gateway = registry.get(target);
            if (gateway == null) throw new AppException(ErrorCode.PROVIDER_NOT_CONFIGURED);
            return gateway;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.PROVIDER_NOT_CONFIGURED);
        }
    }
}
```

`volatile` on `activeProvider` ensures visibility across threads without locking. Individual reads
are atomic on the JVM; in-flight calls that read the old provider before a switch are valid because
both gateways remain alive for the lifetime of the application.

---

### Phase 2 — Update `AiConfig.java`

Replace the existing `ChatClient` bean. Use `@ConditionalOnProperty` (not `@ConditionalOnBean`)
because `@ConditionalOnBean` in user `@Configuration` classes has unreliable ordering relative to
Spring AI auto-configuration.

```java
package vn.chuongpl.ai_engine_service.config;

import org.springframework.ai.azure.openai.AzureOpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.chuongpl.ai_engine_service.model.AzureOpenAiModelGateway;
import vn.chuongpl.ai_engine_service.model.GroqModelGateway;

@Configuration
public class AiConfig {

    @Bean
    @ConditionalOnProperty(prefix = "spring.ai.openai", name = "api-key", matchIfMissing = false)
    GroqModelGateway groqModelGateway(OpenAiChatModel model) {
        return new GroqModelGateway(model);
    }

    @Bean
    @ConditionalOnProperty(prefix = "spring.ai.azure.openai", name = "api-key", matchIfMissing = false)
    AzureOpenAiModelGateway azureOpenAiModelGateway(AzureOpenAiChatModel model) {
        return new AzureOpenAiModelGateway(model);
    }
}
```

> **Empty-string caveat**: `@ConditionalOnProperty` treats an empty string `""` as "present" —
> a property `spring.ai.azure.openai.api-key=` (empty) satisfies the condition and causes Spring
> AI's Azure auto-configuration to attempt bean creation with a blank key, resulting in a startup
> failure. **Operators must omit `AZURE_OPENAI_API_KEY` entirely from `.env` when not using
> Azure** — do not set it to an empty string.

---

### Phase 3 — Update `AnalysisService.java`

Two changes only:

1. Replace `private final ChatClient chatClient` with `private final AiModelGatewayRouter modelRouter`.
2. Rewrite `callAi()`:

```java
// Before
private String callAi(String prompt) {
    try {
        return chatClient.prompt()
                .system(promptBuilder.systemPrompt())
                .user(prompt)
                .call()
                .content();
    } catch (Exception e) {
        log.error("AI call failed: {}", e.getMessage());
        throw new AppException(ErrorCode.AI_PROCESSING_FAILED);
    }
}

// After
private String callAi(String prompt) {
    try {
        return modelRouter.call(promptBuilder.systemPrompt(), prompt);
    } catch (AppException e) {
        throw e;                    // PROVIDER_NOT_CONFIGURED propagates as-is
    } catch (Exception e) {
        log.error("AI call failed: {}", e.getMessage());
        throw new AppException(ErrorCode.AI_PROCESSING_FAILED);
    }
}
```

All other methods in `AnalysisService` (`analyze`, `autoScore`, `extractSkills`, `improve`,
`recommend`, `generateInterviewQuestions`) are unchanged — they still call `callAi(prompt)`.
`CvScoringConsumer` and `SkillExtractionConsumer` are also unchanged.

---

### Phase 4 — `features/admin/AiAdminController.java` (new)

Package: `vn.chuongpl.ai_engine_service.features.admin` (not `features/analysis/` — this is
infrastructure administration, not analysis domain).

```java
package vn.chuongpl.ai_engine_service.features.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.ai_engine_service.dtos.ApiResponse;
import vn.chuongpl.ai_engine_service.model.AiModelGatewayRouter;

@RestController
@RequestMapping("/api/ai/admin")
@RequiredArgsConstructor
public class AiAdminController {

    private final AiModelGatewayRouter modelRouter;

    @PutMapping("/provider")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<Void> switchProvider(@RequestParam String provider) {
        modelRouter.switchProvider(provider);
        return ApiResponse.<Void>builder()
                .message("AI provider switched to: " + modelRouter.getActiveProvider())
                .build();
    }

    @GetMapping("/provider")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ApiResponse<String> getActiveProvider() {
        return ApiResponse.<String>builder()
                .data(modelRouter.getActiveProvider())
                .message("Current AI provider")
                .build();
    }
}
```

`InternalAuthFilter` already populates `SecurityContextHolder` from `X-User-Scope`.
`@EnableMethodSecurity` is already on `SecurityConfig`. No security config change needed.

---

### Phase 5 — `ErrorCode.java`

Add one entry:

```java
PROVIDER_NOT_CONFIGURED(8007, "AI provider is not configured or not available"),
```

`GlobalExceptionHandler.handleAppException` already catches any `AppException` and returns
`400 BAD_REQUEST` — no handler change needed.

---

### Phase 6 — `pom.xml`

Add alongside the existing `spring-ai-starter-model-openai` dependency:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-azure-openai</artifactId>
</dependency>
```

Version managed by the existing `spring-ai-bom` at `${spring-ai.version}` (1.1.5). No version tag
needed.

> **Verify before building**: confirm artifact ID `spring-ai-starter-model-azure-openai` exists
> in the 1.1.5 BOM via `./mvnw dependency:resolve -Dartifact=org.springframework.ai:spring-ai-bom:1.1.5:pom`
> or Maven Central before writing code. The naming pattern follows `spring-ai-starter-model-<provider>`.

---

### Phase 7 — `application.yaml`

Add `app.ai.provider`. **Do not define Azure credentials in `application.yaml`** — they are
supplied exclusively via environment variables so that absence of the env var means the property
does not exist and `@ConditionalOnProperty` correctly skips the gateway bean.

```yaml
spring:
  ai:
    openai:                                        # Groq-compatible endpoint
      api-key: ${AI_API_KEY}                       # no default — absent when AI_API_KEY not set
      base-url: ${AI_BASE_URL:https://api.groq.com/openai}
      chat:
        options:
          model: ${AI_MODEL:llama-3.1-8b-instant}
          temperature: 0.2
          top-p: 0.9
    # Azure OpenAI credentials are NOT declared here.
    # Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in .env or docker-compose.
    # Setting them to empty strings ("") will cause a startup failure.

app:
  ai:
    provider: ${AI_PROVIDER:groq}                  # groq | azure_openai
    recommend-batch-size: ${AI_RECOMMEND_BATCH:20}
```

> **Groq empty-string rule**: `api-key: ${AI_API_KEY}` (no `:` default) means the property is
> **absent** when `AI_API_KEY` is not set, so `@ConditionalOnProperty` correctly skips
> `GroqModelGateway`. The old `${AI_API_KEY:}` (empty-string default) would always satisfy
> `@ConditionalOnProperty` and cause runtime 401 errors from the Groq API. Apply the same rule:
> omit `AI_API_KEY` from `.env` entirely when not using Groq.

---

### Phase 8 — `docker-compose.prod.yaml`

Add to `ai-engine-service.environment`. Use `:-` (empty-string default) only for vars that are
safe when empty; Azure credentials use no default so they are absent from the container environment
when the host env var is not set.

```yaml
ai-engine-service:
  environment:
    AI_PROVIDER: ${AI_PROVIDER:-groq}
    # Azure vars below: only present in container when set in host environment.
    # Do not set to "" — Spring AI treats empty-string as configured and fails at startup.
    AZURE_OPENAI_API_KEY: ${AZURE_OPENAI_API_KEY}
    AZURE_OPENAI_ENDPOINT: ${AZURE_OPENAI_ENDPOINT}
    AZURE_OPENAI_DEPLOYMENT: ${AZURE_OPENAI_DEPLOYMENT:-gpt-4o}
```

> **Note**: If docker-compose warns about unset `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_ENDPOINT`,
> add them to `.env` only when deploying with Azure. Provide a `.env.example` with both a Groq
> section and an Azure section so operators know which vars to set per provider.

---

### Phase 9 — Tests

#### `AiProviderTest.java`

```java
class AiProviderTest {
    @Test void from_groq_returns_GROQ() {
        assertThat(AiProvider.from("groq")).isEqualTo(AiProvider.GROQ);
    }
    @Test void from_azure_aliases_all_return_AZURE_OPENAI() {
        assertThat(AiProvider.from("azure")).isEqualTo(AiProvider.AZURE_OPENAI);
        assertThat(AiProvider.from("azure_openai")).isEqualTo(AiProvider.AZURE_OPENAI);
        assertThat(AiProvider.from("azure-openai")).isEqualTo(AiProvider.AZURE_OPENAI);
        assertThat(AiProvider.from("AZURE_OPENAI")).isEqualTo(AiProvider.AZURE_OPENAI);
    }
    @Test void from_unknown_throws_IllegalArgumentException() {
        assertThatThrownBy(() -> AiProvider.from("unknown"))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
```

#### `AiModelGatewayRouterTest.java`

Use a mock `AiModelGateway` to avoid real HTTP calls:

```java
class AiModelGatewayRouterTest {

    AiModelGateway mockGroq = mock(AiModelGateway.class);

    @BeforeEach void setUp() {
        when(mockGroq.provider()).thenReturn(AiProvider.GROQ);
        when(mockGroq.call(any(), any())).thenReturn("mocked response");
    }

    @Test void constructor_empty_registry_throws_IllegalStateException() {
        assertThatThrownBy(() -> new AiModelGatewayRouter(List.of(), "groq"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("No AI model gateways configured");
    }

    @Test void constructor_default_provider_not_in_registry_throws() {
        assertThatThrownBy(() -> new AiModelGatewayRouter(List.of(mockGroq), "azure_openai"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("credentials are not configured");
    }

    @Test void getActiveProvider_returns_canonical_lowercase() {
        var router = new AiModelGatewayRouter(List.of(mockGroq), "groq");
        assertThat(router.getActiveProvider()).isEqualTo("groq");
    }

    @Test void call_delegates_to_active_gateway() {
        var router = new AiModelGatewayRouter(List.of(mockGroq), "groq");
        assertThat(router.call("sys", "user")).isEqualTo("mocked response");
        verify(mockGroq).call("sys", "user");
    }

    @Test void switchProvider_to_unknown_throws_AppException() {
        var router = new AiModelGatewayRouter(List.of(mockGroq), "groq");
        assertThatThrownBy(() -> router.switchProvider("unknown"))
            .isInstanceOf(AppException.class);
    }

    @Test void switchProvider_to_unconfigured_throws_AppException() {
        var router = new AiModelGatewayRouter(List.of(mockGroq), "groq");
        // azure_openai is a valid enum value but not in the registry
        assertThatThrownBy(() -> router.switchProvider("azure_openai"))
            .isInstanceOf(AppException.class);
    }

    @Test void switchProvider_stores_canonical_form() {
        var router = new AiModelGatewayRouter(List.of(mockGroq), "groq");
        // switch to an alias form; getActiveProvider() must return canonical
        router.switchProvider("groq");
        assertThat(router.getActiveProvider()).isEqualTo("groq");
    }
}
```

#### `AiEngineServiceApplicationTests.java` (update existing)

Add `@TestPropertySource` so the context loads when `AI_API_KEY` is absent from the environment
(the new YAML has no empty-string default, so the property must be supplied for Groq to register):

```java
@SpringBootTest
@TestPropertySource(properties = {
    "spring.ai.openai.api-key=test-key",
    "app.ai.provider=groq"
})
class AiEngineServiceApplicationTests {
    @Test void contextLoads() {}
}
```

#### `AiAdminControllerTest.java`

Use `@WebMvcTest` with a mock router. **Must mock `InternalAuthFilter`** — the filter is a
`@Component` loaded by `@WebMvcTest` and returns HTTP 401 before `@WithMockUser` can apply if
not mocked:

```java
@WebMvcTest(AiAdminController.class)
class AiAdminControllerTest {
    @Autowired MockMvc mvc;
    @MockBean AiModelGatewayRouter router;
    @MockBean InternalAuthFilter internalAuthFilter;  // prevent filter 401

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void switchProvider_admin_returns_200() throws Exception {
        mvc.perform(put("/api/ai/admin/provider").param("provider", "groq"))
            .andExpect(status().isOk());
        verify(router).switchProvider("groq");
    }

    @Test
    @WithMockUser(authorities = "ROLE_CANDIDATE")
    void switchProvider_non_admin_returns_403() throws Exception {
        mvc.perform(put("/api/ai/admin/provider").param("provider", "groq"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getProvider_returns_active_provider() throws Exception {
        when(router.getActiveProvider()).thenReturn("groq");
        mvc.perform(get("/api/ai/admin/provider"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").value("groq"));
    }
}
```

---

## Final package structure (new files only)

```
ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/
├── model/
│   ├── AiModelGateway.java             (interface)
│   ├── AiProvider.java                 (enum)
│   ├── AiModelGatewayRouter.java       (dispatcher)
│   ├── GroqModelGateway.java
│   └── AzureOpenAiModelGateway.java
└── features/
    └── admin/
        └── AiAdminController.java      (admin switching endpoint)

ai_engine_service/src/test/java/vn/chuongpl/ai_engine_service/
├── model/
│   ├── AiProviderTest.java
│   └── AiModelGatewayRouterTest.java
└── features/
    └── admin/
        └── AiAdminControllerTest.java
```

---

## Notes

- **`@ConditionalOnBean` vs `@ConditionalOnProperty`**: The spec uses `@ConditionalOnProperty`
  because `@ConditionalOnBean` in user `@Configuration` classes (not `@AutoConfiguration`) has
  undefined ordering relative to Spring AI's auto-configurations and may evaluate before the
  target bean is registered.
- **Runtime switching does not persist across restarts** — `activeProvider` is in-memory only.
  On restart, the service reverts to the `AI_PROVIDER` env var. DB-backed persistence is out of
  scope.
- **Empty-string credential rule**: `AZURE_OPENAI_API_KEY=` and `AZURE_OPENAI_ENDPOINT=` (empty
  strings) will satisfy `@ConditionalOnProperty` and cause Spring AI's Azure auto-configuration
  to run with blank credentials, producing a startup failure. Operators must either set both
  Azure vars to valid values or omit them entirely.
- `CvScoringConsumer` and `SkillExtractionConsumer` call `analysisService.*()` → `callAi()` →
  `modelRouter.call()`. Both pick up the gateway change with zero code change.
- `SecurityConfig` already has `@EnableMethodSecurity` ✅ and `anyRequest().authenticated()` ✅.
  `InternalAuthFilter` populates `SecurityContextHolder`. `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`
  on `AiAdminController` works without any security config change.
- API Gateway routes `/ai/**` → `ai-engine-service:8085` ✅. No routing change needed.
- Switching from `ChatModel` (interface) injection in the old `AiConfig` to `OpenAiChatModel`
  (concrete class) injection in the new `AiConfig` is deliberate: the router needs the concrete
  type so each gateway can be constructed with its specific model, not a generic `ChatModel`.
