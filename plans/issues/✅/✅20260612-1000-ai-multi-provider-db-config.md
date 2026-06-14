✅

# AI Multi-Provider Gateway — DB-Backed Dynamic Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded Groq-only AI config with a MongoDB-backed system supporting Groq, Gemini, Anthropic (Claude), and Azure OpenAI — admin configures credentials via API, and the active provider is switched at runtime without restart.

**Architecture:** A `model/` package holds the `AiModelGateway` interface and 4 implementations (one per provider). `AiModelGatewayFactory` constructs the correct `ChatModel` programmatically from a `AiProviderConfig` MongoDB document. `AiModelGatewayRouter` holds the active gateway in a `volatile` field, loads from DB on startup, and swaps on admin request. `AnalysisService` injects the router instead of the old `ChatClient`.

**Tech Stack:** Spring Boot 3.5.14, Spring AI 1.1.5 (`spring-ai-starter-model-openai` already present + `spring-ai-starter-model-azure-openai` + `spring-ai-starter-model-anthropic` new), Spring Data MongoDB (new), Mockito, `@WebMvcTest`.

**Context:**
- Service: `ai_engine_service/`
- Base package: `vn.chuongpl.ai_engine_service`
- Run tests from: `cd ai_engine_service && ./mvnw test`
- Compile check: `cd ai_engine_service && ./mvnw compile -q`
- Spec: `plans/specs/2026-06-12-ai-multi-provider-db-config-design.md`

---

## File Map

**New files:**
- `model/AiProvider.java` — enum with `from(String)` factory
- `model/AiModelGateway.java` — interface: `call(sys, user)` + `provider()`
- `model/GroqModelGateway.java` — wraps `OpenAiChatModel` for Groq
- `model/GeminiModelGateway.java` — wraps `OpenAiChatModel` for Gemini (OpenAI-compatible)
- `model/AnthropicModelGateway.java` — wraps `AnthropicChatModel`
- `model/AzureOpenAiModelGateway.java` — wraps `AzureOpenAiChatModel`
- `model/AiModelGatewayFactory.java` — `@Component`, builds gateway from `AiProviderConfig`
- `model/AiModelGatewayRouter.java` — `@Component`, holds active gateway, init from DB
- `features/admin/AiProviderConfig.java` — `@Document("ai_provider_configs")`
- `features/admin/AiProviderConfigRepository.java` — `MongoRepository`
- `features/admin/AiProviderConfigRequest.java` — PUT body DTO
- `features/admin/AiProviderConfigResponse.java` — response DTO (no apiKey)
- `features/admin/AiAdminService.java` — upsert, activate, delete, list
- `features/admin/AiAdminController.java` — 5 endpoints, all ROLE_ADMIN

**Modified files:**
- `pom.xml` — add MongoDB, Azure AI, Anthropic AI starters
- `config/AiConfig.java` — **DELETE** (ChatClient bean replaced by AiModelGatewayFactory)
- `features/analysis/AnalysisService.java` — swap `ChatClient chatClient` → `AiModelGatewayRouter modelRouter`; rewrite `callAi()`
- `src/main/resources/application.yaml` — remove `spring.ai.openai` block; add MongoDB config
- `enums/ErrorCode.java` — add 3 entries
- `.env.example` — remove AI_* credential vars; add MongoDB var for AI service

**New test files:**
- `model/AiProviderTest.java`
- `model/AiModelGatewayFactoryTest.java`
- `model/AiModelGatewayRouterTest.java`
- `features/admin/AiAdminServiceTest.java`
- `features/admin/AiAdminControllerTest.java`
- `src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`

---

### Task 1: Foundation — pom.xml, application.yaml, ErrorCode, Mockito setup

**Files:**
- Modify: `ai_engine_service/pom.xml`
- Modify: `ai_engine_service/src/main/resources/application.yaml`
- Modify: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/enums/ErrorCode.java`
- Create: `ai_engine_service/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`

- [ ] **Step 1: Add dependencies to pom.xml**

  Open `ai_engine_service/pom.xml`. After the existing `spring-ai-starter-model-openai` dependency, add:

  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-mongodb</artifactId>
  </dependency>
  <dependency>
      <groupId>org.springframework.ai</groupId>
      <artifactId>spring-ai-starter-model-azure-openai</artifactId>
  </dependency>
  <dependency>
      <groupId>org.springframework.ai</groupId>
      <artifactId>spring-ai-starter-model-anthropic</artifactId>
  </dependency>
  ```

- [ ] **Step 2: Update application.yaml**

  Replace the entire `spring.ai.openai` block and add MongoDB config. The new `spring:` section in `application.yaml` should be:

  ```yaml
  spring:
    config:
      import: optional:file:../.env[.properties]
    application:
      name: ai_engine_service
    data:
      mongodb:
        host: ${MONGO_DB_HOST:localhost}
        port: ${MONGO_DB_PORT:27017}
        username: ${MONGO_DB_USERNAME:admin}
        password: ${MONGO_DB_PASSWORD:password}
        database: ${AI_MONGO_DB_NAME:ai_engine_db}
        authentication-database: admin
    main:
      banner-mode: "off"
    rabbitmq:
      host: ${RABBITMQ_HOST:localhost}
      port: ${RABBITMQ_PORT:5672}
      username: ${RABBITMQ_USER:admin}
      password: ${RABBITMQ_PASSWORD:admin123}
  ```

  The `spring.ai.openai.*` block is fully removed — provider config comes from DB now.

- [ ] **Step 3: Add 3 new ErrorCode entries**

  Open `ErrorCode.java`. After `JOB_SERVICE_UNAVAILABLE(8006, ...)`, add:

  ```java
  PROVIDER_NOT_CONFIGURED(8007, "No AI provider is configured or active"),
  PROVIDER_NOT_FOUND(8008, "AI provider config not found"),
  PROVIDER_ACTIVE(8009, "Cannot delete the currently active provider");
  ```

- [ ] **Step 4: Create Mockito inline mock-maker file**

  Create `ai_engine_service/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker` with content:

  ```
  mock-maker-inline
  ```

- [ ] **Step 5: Compile check**

  ```bash
  cd ai_engine_service && ./mvnw compile -q
  ```

  Expected: BUILD SUCCESS. If `spring-ai-starter-model-azure-openai` or `spring-ai-starter-model-anthropic` artifact is not found in BOM 1.1.5, check exact artifact IDs with:
  ```bash
  ./mvnw dependency:resolve -Dartifact=org.springframework.ai:spring-ai-bom:1.1.5:pom 2>&1 | grep -E "anthropic|azure"
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add ai_engine_service/pom.xml \
          ai_engine_service/src/main/resources/application.yaml \
          ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/enums/ErrorCode.java \
          ai_engine_service/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker
  git commit -m "feat(ai-service): add MongoDB + Azure/Anthropic AI starters, extend ErrorCode"
  ```

---

### Task 2: AiProvider Enum

**Files:**
- Create: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/model/AiProvider.java`
- Create: `ai_engine_service/src/test/java/vn/chuongpl/ai_engine_service/model/AiProviderTest.java`

- [ ] **Step 1: Write the failing test**

  Create `src/test/java/vn/chuongpl/ai_engine_service/model/AiProviderTest.java`:

  ```java
  package vn.chuongpl.ai_engine_service.model;

  import org.junit.jupiter.api.Test;

  import static org.assertj.core.api.Assertions.assertThat;
  import static org.assertj.core.api.Assertions.assertThatThrownBy;

  class AiProviderTest {

      @Test
      void from_groq_returns_GROQ() {
          assertThat(AiProvider.from("groq")).isEqualTo(AiProvider.GROQ);
      }

      @Test
      void from_gemini_aliases_return_GEMINI() {
          assertThat(AiProvider.from("gemini")).isEqualTo(AiProvider.GEMINI);
          assertThat(AiProvider.from("google")).isEqualTo(AiProvider.GEMINI);
          assertThat(AiProvider.from("google_gemini")).isEqualTo(AiProvider.GEMINI);
          assertThat(AiProvider.from("GEMINI")).isEqualTo(AiProvider.GEMINI);
      }

      @Test
      void from_anthropic_aliases_return_ANTHROPIC() {
          assertThat(AiProvider.from("anthropic")).isEqualTo(AiProvider.ANTHROPIC);
          assertThat(AiProvider.from("claude")).isEqualTo(AiProvider.ANTHROPIC);
      }

      @Test
      void from_azure_aliases_return_AZURE_OPENAI() {
          assertThat(AiProvider.from("azure")).isEqualTo(AiProvider.AZURE_OPENAI);
          assertThat(AiProvider.from("azure_openai")).isEqualTo(AiProvider.AZURE_OPENAI);
          assertThat(AiProvider.from("azure-openai")).isEqualTo(AiProvider.AZURE_OPENAI);
      }

      @Test
      void from_unknown_throws_IllegalArgumentException() {
          assertThatThrownBy(() -> AiProvider.from("unknown"))
              .isInstanceOf(IllegalArgumentException.class)
              .hasMessageContaining("Unknown AI provider: unknown");
      }
  }
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiProviderTest -q 2>&1 | tail -5
  ```

  Expected: FAIL — `AiProvider` does not exist yet.

- [ ] **Step 3: Implement AiProvider enum**

  Create `src/main/java/vn/chuongpl/ai_engine_service/model/AiProvider.java`:

  ```java
  package vn.chuongpl.ai_engine_service.model;

  public enum AiProvider {
      GROQ, AZURE_OPENAI, ANTHROPIC, GEMINI;

      public static AiProvider from(String value) {
          return switch (value.trim().toLowerCase()) {
              case "groq"                                  -> GROQ;
              case "azure", "azure_openai", "azure-openai" -> AZURE_OPENAI;
              case "anthropic", "claude"                   -> ANTHROPIC;
              case "gemini", "google", "google_gemini"     -> GEMINI;
              default -> throw new IllegalArgumentException("Unknown AI provider: " + value);
          };
      }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiProviderTest -q 2>&1 | tail -5
  ```

  Expected: BUILD SUCCESS, Tests run: 5, Failures: 0.

- [ ] **Step 5: Commit**

  ```bash
  git add ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/model/AiProvider.java \
          ai_engine_service/src/test/java/vn/chuongpl/ai_engine_service/model/AiProviderTest.java
  git commit -m "feat(ai-service): add AiProvider enum with from() factory"
  ```

---

### Task 3: AiProviderConfig Document + Repository

**Files:**
- Create: `features/admin/AiProviderConfig.java`
- Create: `features/admin/AiProviderConfigRepository.java`

- [ ] **Step 1: Create AiProviderConfig document**

  Create `src/main/java/vn/chuongpl/ai_engine_service/features/admin/AiProviderConfig.java`:

  ```java
  package vn.chuongpl.ai_engine_service.features.admin;

  import lombok.AccessLevel;
  import lombok.AllArgsConstructor;
  import lombok.Builder;
  import lombok.Data;
  import lombok.NoArgsConstructor;
  import lombok.experimental.FieldDefaults;
  import org.springframework.data.annotation.Id;
  import org.springframework.data.mongodb.core.index.Indexed;
  import org.springframework.data.mongodb.core.mapping.Document;
  import vn.chuongpl.ai_engine_service.model.AiProvider;

  import java.time.LocalDateTime;

  @Document("ai_provider_configs")
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @FieldDefaults(level = AccessLevel.PRIVATE)
  public class AiProviderConfig {

      @Id
      String id;

      @Indexed(unique = true)
      AiProvider provider;

      String apiKey;
      String model;
      String baseUrl;
      String deploymentName;
      boolean active;
      LocalDateTime updatedAt;
  }
  ```

- [ ] **Step 2: Create AiProviderConfigRepository**

  Create `src/main/java/vn/chuongpl/ai_engine_service/features/admin/AiProviderConfigRepository.java`:

  ```java
  package vn.chuongpl.ai_engine_service.features.admin;

  import org.springframework.data.mongodb.repository.MongoRepository;
  import vn.chuongpl.ai_engine_service.model.AiProvider;

  import java.util.Optional;

  public interface AiProviderConfigRepository extends MongoRepository<AiProviderConfig, String> {
      Optional<AiProviderConfig> findByProvider(AiProvider provider);
      Optional<AiProviderConfig> findByActiveTrue();
  }
  ```

- [ ] **Step 3: Compile check**

  ```bash
  cd ai_engine_service && ./mvnw compile -q
  ```

  Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

  ```bash
  git add ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/features/admin/AiProviderConfig.java \
          ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/features/admin/AiProviderConfigRepository.java
  git commit -m "feat(ai-service): add AiProviderConfig document and repository"
  ```

---

### Task 4: AiModelGateway Interface + 4 Implementations

**Files:**
- Create: `model/AiModelGateway.java`
- Create: `model/GroqModelGateway.java`
- Create: `model/GeminiModelGateway.java`
- Create: `model/AnthropicModelGateway.java`
- Create: `model/AzureOpenAiModelGateway.java`

None of these are `@Component` — they are created by `AiModelGatewayFactory` in Task 5.

- [ ] **Step 1: Create AiModelGateway interface**

  Create `src/main/java/vn/chuongpl/ai_engine_service/model/AiModelGateway.java`:

  ```java
  package vn.chuongpl.ai_engine_service.model;

  public interface AiModelGateway {
      String call(String systemPrompt, String userPrompt);
      AiProvider provider();
  }
  ```

- [ ] **Step 2: Create GroqModelGateway**

  Create `src/main/java/vn/chuongpl/ai_engine_service/model/GroqModelGateway.java`:

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

- [ ] **Step 3: Create GeminiModelGateway**

  Create `src/main/java/vn/chuongpl/ai_engine_service/model/GeminiModelGateway.java`:

  ```java
  package vn.chuongpl.ai_engine_service.model;

  import lombok.RequiredArgsConstructor;
  import org.springframework.ai.chat.client.ChatClient;
  import org.springframework.ai.openai.OpenAiChatModel;

  @RequiredArgsConstructor
  public class GeminiModelGateway implements AiModelGateway {

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
          return AiProvider.GEMINI;
      }
  }
  ```

- [ ] **Step 4: Create AnthropicModelGateway**

  Create `src/main/java/vn/chuongpl/ai_engine_service/model/AnthropicModelGateway.java`:

  ```java
  package vn.chuongpl.ai_engine_service.model;

  import lombok.RequiredArgsConstructor;
  import org.springframework.ai.anthropic.AnthropicChatModel;
  import org.springframework.ai.chat.client.ChatClient;

  @RequiredArgsConstructor
  public class AnthropicModelGateway implements AiModelGateway {

      private final AnthropicChatModel chatModel;

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
          return AiProvider.ANTHROPIC;
      }
  }
  ```

- [ ] **Step 5: Create AzureOpenAiModelGateway**

  Create `src/main/java/vn/chuongpl/ai_engine_service/model/AzureOpenAiModelGateway.java`:

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

- [ ] **Step 6: Compile check**

  ```bash
  cd ai_engine_service && ./mvnw compile -q
  ```

  Expected: BUILD SUCCESS.

- [ ] **Step 7: Commit**

  ```bash
  git add ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/model/
  git commit -m "feat(ai-service): add AiModelGateway interface and 4 provider implementations"
  ```

---

### Task 5: AiModelGatewayFactory

**Files:**
- Create: `model/AiModelGatewayFactory.java`
- Create: `test/model/AiModelGatewayFactoryTest.java`

The factory creates Spring AI model objects programmatically (no Spring Boot auto-config). Model constructors do NOT make HTTP calls — safe to invoke in tests with dummy credentials.

- [ ] **Step 1: Write the failing test**

  Create `src/test/java/vn/chuongpl/ai_engine_service/model/AiModelGatewayFactoryTest.java`:

  ```java
  package vn.chuongpl.ai_engine_service.model;

  import org.junit.jupiter.api.BeforeEach;
  import org.junit.jupiter.api.Test;
  import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfig;

  import static org.assertj.core.api.Assertions.assertThat;

  class AiModelGatewayFactoryTest {

      AiModelGatewayFactory factory;

      @BeforeEach
      void setUp() {
          factory = new AiModelGatewayFactory();
      }

      @Test
      void create_groq_config_returns_GroqModelGateway() {
          var config = AiProviderConfig.builder()
                  .provider(AiProvider.GROQ)
                  .apiKey("test-key")
                  .model("llama-3.1-8b-instant")
                  .baseUrl("https://api.groq.com/openai")
                  .build();

          AiModelGateway gateway = factory.create(config);

          assertThat(gateway).isInstanceOf(GroqModelGateway.class);
          assertThat(gateway.provider()).isEqualTo(AiProvider.GROQ);
      }

      @Test
      void create_gemini_config_returns_GeminiModelGateway() {
          var config = AiProviderConfig.builder()
                  .provider(AiProvider.GEMINI)
                  .apiKey("test-key")
                  .model("gemini-1.5-flash")
                  .baseUrl("https://generativelanguage.googleapis.com/v1beta/openai")
                  .build();

          AiModelGateway gateway = factory.create(config);

          assertThat(gateway).isInstanceOf(GeminiModelGateway.class);
          assertThat(gateway.provider()).isEqualTo(AiProvider.GEMINI);
      }

      @Test
      void create_anthropic_config_returns_AnthropicModelGateway() {
          var config = AiProviderConfig.builder()
                  .provider(AiProvider.ANTHROPIC)
                  .apiKey("test-key")
                  .model("claude-sonnet-4-6")
                  .build();

          AiModelGateway gateway = factory.create(config);

          assertThat(gateway).isInstanceOf(AnthropicModelGateway.class);
          assertThat(gateway.provider()).isEqualTo(AiProvider.ANTHROPIC);
      }

      @Test
      void create_azure_config_returns_AzureOpenAiModelGateway() {
          var config = AiProviderConfig.builder()
                  .provider(AiProvider.AZURE_OPENAI)
                  .apiKey("test-key")
                  .model("gpt-4o")
                  .baseUrl("https://test.openai.azure.com")
                  .deploymentName("gpt-4o")
                  .build();

          AiModelGateway gateway = factory.create(config);

          assertThat(gateway).isInstanceOf(AzureOpenAiModelGateway.class);
          assertThat(gateway.provider()).isEqualTo(AiProvider.AZURE_OPENAI);
      }
  }
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiModelGatewayFactoryTest -q 2>&1 | tail -5
  ```

  Expected: FAIL — `AiModelGatewayFactory` does not exist yet.

- [ ] **Step 3: Implement AiModelGatewayFactory**

  Create `src/main/java/vn/chuongpl/ai_engine_service/model/AiModelGatewayFactory.java`:

  ```java
  package vn.chuongpl.ai_engine_service.model;

  import com.azure.ai.openai.OpenAIClientBuilder;
  import com.azure.core.credential.AzureKeyCredential;
  import org.springframework.ai.anthropic.AnthropicChatModel;
  import org.springframework.ai.anthropic.AnthropicChatOptions;
  import org.springframework.ai.anthropic.api.AnthropicApi;
  import org.springframework.ai.azure.openai.AzureOpenAiChatModel;
  import org.springframework.ai.azure.openai.AzureOpenAiChatOptions;
  import org.springframework.ai.openai.OpenAiChatModel;
  import org.springframework.ai.openai.OpenAiChatOptions;
  import org.springframework.ai.openai.api.OpenAiApi;
  import org.springframework.stereotype.Component;
  import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfig;

  @Component
  public class AiModelGatewayFactory {

      public AiModelGateway create(AiProviderConfig config) {
          return switch (config.getProvider()) {
              case GROQ         -> buildGroq(config);
              case GEMINI       -> buildGemini(config);
              case ANTHROPIC    -> buildAnthropic(config);
              case AZURE_OPENAI -> buildAzure(config);
          };
      }

      private GroqModelGateway buildGroq(AiProviderConfig c) {
          var api = new OpenAiApi(c.getBaseUrl(), c.getApiKey());
          var model = new OpenAiChatModel(api,
                  OpenAiChatOptions.builder().model(c.getModel()).temperature(0.2).build());
          return new GroqModelGateway(model);
      }

      private GeminiModelGateway buildGemini(AiProviderConfig c) {
          var api = new OpenAiApi(c.getBaseUrl(), c.getApiKey());
          var model = new OpenAiChatModel(api,
                  OpenAiChatOptions.builder().model(c.getModel()).temperature(0.2).build());
          return new GeminiModelGateway(model);
      }

      private AnthropicModelGateway buildAnthropic(AiProviderConfig c) {
          var api = new AnthropicApi(c.getApiKey());
          var model = new AnthropicChatModel(api,
                  AnthropicChatOptions.builder()
                          .model(c.getModel())
                          .maxTokens(4096)
                          .temperature(0.2f)
                          .build());
          return new AnthropicModelGateway(model);
      }

      private AzureOpenAiModelGateway buildAzure(AiProviderConfig c) {
          var openAiClient = new OpenAIClientBuilder()
                  .credential(new AzureKeyCredential(c.getApiKey()))
                  .endpoint(c.getBaseUrl())
                  .buildClient();
          var model = new AzureOpenAiChatModel(openAiClient,
                  AzureOpenAiChatOptions.builder()
                          .deploymentName(c.getDeploymentName())
                          .temperature(0.2)
                          .build());
          return new AzureOpenAiModelGateway(model);
      }
  }
  ```

  > **If compilation fails** on `OpenAiApi`, `AnthropicChatModel`, or `AzureOpenAiChatModel` constructor signatures, check the Spring AI 1.1.5 Javadoc. Common fix: use `OpenAiChatModel.builder().openAiApi(api).defaultOptions(opts).build()` if the two-arg constructor is not available.

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiModelGatewayFactoryTest -q 2>&1 | tail -5
  ```

  Expected: BUILD SUCCESS, Tests run: 4, Failures: 0.

- [ ] **Step 5: Commit**

  ```bash
  git add ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/model/AiModelGatewayFactory.java \
          ai_engine_service/src/test/java/vn/chuongpl/ai_engine_service/model/AiModelGatewayFactoryTest.java
  git commit -m "feat(ai-service): add AiModelGatewayFactory for programmatic provider instantiation"
  ```

---

### Task 6: AiModelGatewayRouter

**Files:**
- Create: `model/AiModelGatewayRouter.java`
- Create: `test/model/AiModelGatewayRouterTest.java`

- [ ] **Step 1: Write the failing test**

  Create `src/test/java/vn/chuongpl/ai_engine_service/model/AiModelGatewayRouterTest.java`:

  ```java
  package vn.chuongpl.ai_engine_service.model;

  import org.junit.jupiter.api.BeforeEach;
  import org.junit.jupiter.api.Test;
  import org.junit.jupiter.api.extension.ExtendWith;
  import org.mockito.Mock;
  import org.mockito.junit.jupiter.MockitoExtension;
  import vn.chuongpl.ai_engine_service.enums.ErrorCode;
  import vn.chuongpl.ai_engine_service.exception.AppException;
  import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfig;
  import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfigRepository;

  import java.util.Optional;

  import static org.assertj.core.api.Assertions.assertThat;
  import static org.assertj.core.api.Assertions.assertThatThrownBy;
  import static org.mockito.ArgumentMatchers.any;
  import static org.mockito.Mockito.*;

  @ExtendWith(MockitoExtension.class)
  class AiModelGatewayRouterTest {

      @Mock AiProviderConfigRepository repository;
      @Mock AiModelGatewayFactory factory;
      @Mock AiModelGateway mockGateway;

      AiModelGatewayRouter router;

      @BeforeEach
      void setUp() {
          router = new AiModelGatewayRouter(repository, factory);
      }

      @Test
      void init_with_active_config_sets_gateway() {
          var config = AiProviderConfig.builder().provider(AiProvider.GROQ).build();
          when(repository.findByActiveTrue()).thenReturn(Optional.of(config));
          when(factory.create(config)).thenReturn(mockGateway);
          when(mockGateway.provider()).thenReturn(AiProvider.GROQ);

          router.init();

          assertThat(router.getActiveProvider()).isEqualTo("groq");
      }

      @Test
      void init_with_no_active_config_leaves_gateway_null() {
          when(repository.findByActiveTrue()).thenReturn(Optional.empty());

          router.init();

          assertThat(router.getActiveProvider()).isEqualTo("none");
      }

      @Test
      void call_with_null_gateway_throws_PROVIDER_NOT_CONFIGURED() {
          when(repository.findByActiveTrue()).thenReturn(Optional.empty());
          router.init();

          assertThatThrownBy(() -> router.call("sys", "user"))
              .isInstanceOf(AppException.class)
              .extracting(e -> ((AppException) e).getErrorCode())
              .isEqualTo(ErrorCode.PROVIDER_NOT_CONFIGURED);
      }

      @Test
      void call_delegates_to_active_gateway() {
          var config = AiProviderConfig.builder().provider(AiProvider.GEMINI).build();
          when(repository.findByActiveTrue()).thenReturn(Optional.of(config));
          when(factory.create(config)).thenReturn(mockGateway);
          when(mockGateway.provider()).thenReturn(AiProvider.GEMINI);
          when(mockGateway.call("sys", "user")).thenReturn("response");
          router.init();

          String result = router.call("sys", "user");

          assertThat(result).isEqualTo("response");
          verify(mockGateway).call("sys", "user");
      }

      @Test
      void activate_swaps_gateway_and_persists() {
          when(repository.findByActiveTrue()).thenReturn(Optional.empty());
          router.init();

          var newConfig = AiProviderConfig.builder().provider(AiProvider.GEMINI)
                  .apiKey("key").model("gemini-1.5-flash").build();
          when(factory.create(newConfig)).thenReturn(mockGateway);
          when(mockGateway.provider()).thenReturn(AiProvider.GEMINI);
          when(repository.save(any())).thenReturn(newConfig);

          router.activate(newConfig);

          assertThat(router.getActiveProvider()).isEqualTo("gemini");
          verify(repository, atLeastOnce()).save(any());
      }

      @Test
      void getActiveProvider_returns_none_when_no_gateway() {
          when(repository.findByActiveTrue()).thenReturn(Optional.empty());
          router.init();

          assertThat(router.getActiveProvider()).isEqualTo("none");
      }
  }
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiModelGatewayRouterTest -q 2>&1 | tail -5
  ```

  Expected: FAIL — `AiModelGatewayRouter` does not exist.

- [ ] **Step 3: Implement AiModelGatewayRouter**

  Create `src/main/java/vn/chuongpl/ai_engine_service/model/AiModelGatewayRouter.java`:

  ```java
  package vn.chuongpl.ai_engine_service.model;

  import jakarta.annotation.PostConstruct;
  import lombok.RequiredArgsConstructor;
  import lombok.extern.slf4j.Slf4j;
  import org.springframework.stereotype.Component;
  import vn.chuongpl.ai_engine_service.enums.ErrorCode;
  import vn.chuongpl.ai_engine_service.exception.AppException;
  import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfig;
  import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfigRepository;

  import java.time.LocalDateTime;

  @Component
  @RequiredArgsConstructor
  @Slf4j
  public class AiModelGatewayRouter {

      private final AiProviderConfigRepository repository;
      private final AiModelGatewayFactory factory;

      private volatile AiModelGateway activeGateway;

      @PostConstruct
      void init() {
          repository.findByActiveTrue().ifPresentOrElse(
              config -> {
                  activeGateway = factory.create(config);
                  log.info("AI gateway initialized with provider: {}", config.getProvider());
              },
              () -> log.warn("No active AI provider configured. Activate one via POST /api/ai/admin/providers/{provider}/activate")
          );
      }

      public String call(String systemPrompt, String userPrompt) {
          AiModelGateway gateway = activeGateway;
          if (gateway == null) throw new AppException(ErrorCode.PROVIDER_NOT_CONFIGURED);
          return gateway.call(systemPrompt, userPrompt);
      }

      public void activate(AiProviderConfig config) {
          AiModelGateway gateway = factory.create(config);
          repository.findByActiveTrue().ifPresent(current -> {
              current.setActive(false);
              current.setUpdatedAt(LocalDateTime.now());
              repository.save(current);
          });
          config.setActive(true);
          config.setUpdatedAt(LocalDateTime.now());
          repository.save(config);
          activeGateway = gateway;
          log.info("AI provider switched to: {}", config.getProvider());
      }

      public String getActiveProvider() {
          AiModelGateway gateway = activeGateway;
          return gateway == null ? "none" : gateway.provider().name().toLowerCase();
      }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiModelGatewayRouterTest -q 2>&1 | tail -5
  ```

  Expected: BUILD SUCCESS, Tests run: 6, Failures: 0.

- [ ] **Step 5: Commit**

  ```bash
  git add ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/model/AiModelGatewayRouter.java \
          ai_engine_service/src/test/java/vn/chuongpl/ai_engine_service/model/AiModelGatewayRouterTest.java
  git commit -m "feat(ai-service): add AiModelGatewayRouter with DB-backed startup and runtime switching"
  ```

---

### Task 7: AiAdminService + Request/Response DTOs

**Files:**
- Create: `features/admin/AiProviderConfigRequest.java`
- Create: `features/admin/AiProviderConfigResponse.java`
- Create: `features/admin/AiAdminService.java`
- Create: `test/features/admin/AiAdminServiceTest.java`

- [ ] **Step 1: Create DTOs**

  Create `src/main/java/vn/chuongpl/ai_engine_service/features/admin/AiProviderConfigRequest.java`:

  ```java
  package vn.chuongpl.ai_engine_service.features.admin;

  import lombok.AccessLevel;
  import lombok.Data;
  import lombok.experimental.FieldDefaults;

  @Data
  @FieldDefaults(level = AccessLevel.PRIVATE)
  public class AiProviderConfigRequest {
      String apiKey;         // required on create; null = keep existing on update
      String model;          // required
      String baseUrl;        // required for GROQ, AZURE_OPENAI, GEMINI; null for ANTHROPIC
      String deploymentName; // required for AZURE_OPENAI; null for others
  }
  ```

  Create `src/main/java/vn/chuongpl/ai_engine_service/features/admin/AiProviderConfigResponse.java`:

  ```java
  package vn.chuongpl.ai_engine_service.features.admin;

  import lombok.AccessLevel;
  import lombok.AllArgsConstructor;
  import lombok.Builder;
  import lombok.Data;
  import lombok.NoArgsConstructor;
  import lombok.experimental.FieldDefaults;
  import vn.chuongpl.ai_engine_service.model.AiProvider;

  import java.time.LocalDateTime;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @FieldDefaults(level = AccessLevel.PRIVATE)
  public class AiProviderConfigResponse {
      AiProvider provider;
      String model;
      String baseUrl;
      String deploymentName;
      boolean active;
      boolean configured;    // true if apiKey is stored; apiKey itself is never returned
      LocalDateTime updatedAt;
  }
  ```

- [ ] **Step 2: Write the failing test**

  Create `src/test/java/vn/chuongpl/ai_engine_service/features/admin/AiAdminServiceTest.java`:

  ```java
  package vn.chuongpl.ai_engine_service.features.admin;

  import org.junit.jupiter.api.BeforeEach;
  import org.junit.jupiter.api.Test;
  import org.junit.jupiter.api.extension.ExtendWith;
  import org.mockito.Mock;
  import org.mockito.junit.jupiter.MockitoExtension;
  import vn.chuongpl.ai_engine_service.enums.ErrorCode;
  import vn.chuongpl.ai_engine_service.exception.AppException;
  import vn.chuongpl.ai_engine_service.model.AiProvider;
  import vn.chuongpl.ai_engine_service.model.AiModelGatewayRouter;

  import java.util.List;
  import java.util.Optional;

  import static org.assertj.core.api.Assertions.assertThat;
  import static org.assertj.core.api.Assertions.assertThatThrownBy;
  import static org.mockito.ArgumentMatchers.any;
  import static org.mockito.Mockito.*;

  @ExtendWith(MockitoExtension.class)
  class AiAdminServiceTest {

      @Mock AiProviderConfigRepository repository;
      @Mock AiModelGatewayRouter router;

      AiAdminService service;

      @BeforeEach
      void setUp() {
          service = new AiAdminService(repository, router);
      }

      @Test
      void upsert_new_provider_creates_document() {
          when(repository.findByProvider(AiProvider.GROQ)).thenReturn(Optional.empty());
          when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

          var request = new AiProviderConfigRequest();
          request.setApiKey("gsk-test");
          request.setModel("llama-3.1-8b-instant");
          request.setBaseUrl("https://api.groq.com/openai");

          AiProviderConfigResponse response = service.upsert("groq", request);

          assertThat(response.getProvider()).isEqualTo(AiProvider.GROQ);
          assertThat(response.isConfigured()).isTrue();
          assertThat(response.getModel()).isEqualTo("llama-3.1-8b-instant");
          verify(repository).save(any(AiProviderConfig.class));
      }

      @Test
      void upsert_existing_provider_keeps_apiKey_when_null() {
          var existing = AiProviderConfig.builder()
                  .provider(AiProvider.GROQ).apiKey("original-key").model("old-model").build();
          when(repository.findByProvider(AiProvider.GROQ)).thenReturn(Optional.of(existing));
          when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

          var request = new AiProviderConfigRequest();
          request.setApiKey(null);   // no new key — keep existing
          request.setModel("new-model");
          request.setBaseUrl("https://api.groq.com/openai");

          service.upsert("groq", request);

          verify(repository).save(argThat(c -> "original-key".equals(c.getApiKey())
                  && "new-model".equals(c.getModel())));
      }

      @Test
      void activate_calls_router_activate() {
          var config = AiProviderConfig.builder()
                  .provider(AiProvider.GEMINI).apiKey("key").model("gemini-1.5-flash").build();
          when(repository.findByProvider(AiProvider.GEMINI)).thenReturn(Optional.of(config));
          doNothing().when(router).activate(config);

          service.activate("gemini");

          verify(router).activate(config);
      }

      @Test
      void activate_provider_not_found_throws_PROVIDER_NOT_FOUND() {
          when(repository.findByProvider(AiProvider.GEMINI)).thenReturn(Optional.empty());

          assertThatThrownBy(() -> service.activate("gemini"))
              .isInstanceOf(AppException.class)
              .extracting(e -> ((AppException) e).getErrorCode())
              .isEqualTo(ErrorCode.PROVIDER_NOT_FOUND);
      }

      @Test
      void activate_provider_without_apiKey_throws_PROVIDER_NOT_CONFIGURED() {
          var config = AiProviderConfig.builder()
                  .provider(AiProvider.GEMINI).apiKey(null).build();
          when(repository.findByProvider(AiProvider.GEMINI)).thenReturn(Optional.of(config));

          assertThatThrownBy(() -> service.activate("gemini"))
              .isInstanceOf(AppException.class)
              .extracting(e -> ((AppException) e).getErrorCode())
              .isEqualTo(ErrorCode.PROVIDER_NOT_CONFIGURED);
      }

      @Test
      void delete_active_provider_throws_PROVIDER_ACTIVE() {
          var config = AiProviderConfig.builder()
                  .provider(AiProvider.GROQ).active(true).apiKey("key").build();
          when(repository.findByProvider(AiProvider.GROQ)).thenReturn(Optional.of(config));

          assertThatThrownBy(() -> service.delete("groq"))
              .isInstanceOf(AppException.class)
              .extracting(e -> ((AppException) e).getErrorCode())
              .isEqualTo(ErrorCode.PROVIDER_ACTIVE);
      }

      @Test
      void delete_inactive_provider_removes_document() {
          var config = AiProviderConfig.builder()
                  .provider(AiProvider.GROQ).active(false).apiKey("key").build();
          when(repository.findByProvider(AiProvider.GROQ)).thenReturn(Optional.of(config));

          service.delete("groq");

          verify(repository).delete(config);
      }

      @Test
      void listAll_returns_responses_without_apiKey() {
          when(repository.findAll()).thenReturn(List.of(
              AiProviderConfig.builder().provider(AiProvider.GROQ).apiKey("secret").model("m1").build(),
              AiProviderConfig.builder().provider(AiProvider.GEMINI).apiKey(null).model("m2").build()
          ));

          List<AiProviderConfigResponse> result = service.listAll();

          assertThat(result).hasSize(2);
          assertThat(result.get(0).isConfigured()).isTrue();
          assertThat(result.get(1).isConfigured()).isFalse();
      }
  }
  ```

- [ ] **Step 3: Run test to verify it fails**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiAdminServiceTest -q 2>&1 | tail -5
  ```

  Expected: FAIL — `AiAdminService` does not exist.

- [ ] **Step 4: Implement AiAdminService**

  Create `src/main/java/vn/chuongpl/ai_engine_service/features/admin/AiAdminService.java`:

  ```java
  package vn.chuongpl.ai_engine_service.features.admin;

  import lombok.RequiredArgsConstructor;
  import org.springframework.stereotype.Service;
  import vn.chuongpl.ai_engine_service.enums.ErrorCode;
  import vn.chuongpl.ai_engine_service.exception.AppException;
  import vn.chuongpl.ai_engine_service.model.AiModelGatewayRouter;
  import vn.chuongpl.ai_engine_service.model.AiProvider;

  import java.time.LocalDateTime;
  import java.util.List;

  @Service
  @RequiredArgsConstructor
  public class AiAdminService {

      private final AiProviderConfigRepository repository;
      private final AiModelGatewayRouter router;

      public AiProviderConfigResponse upsert(String providerStr, AiProviderConfigRequest request) {
          AiProvider provider = parseProvider(providerStr);
          AiProviderConfig config = repository.findByProvider(provider)
                  .orElse(AiProviderConfig.builder().provider(provider).build());

          if (request.getApiKey() != null) config.setApiKey(request.getApiKey());
          config.setModel(request.getModel());
          config.setBaseUrl(request.getBaseUrl());
          config.setDeploymentName(request.getDeploymentName());
          config.setUpdatedAt(LocalDateTime.now());
          return toResponse(repository.save(config));
      }

      public AiProviderConfigResponse activate(String providerStr) {
          AiProvider provider = parseProvider(providerStr);
          AiProviderConfig config = repository.findByProvider(provider)
                  .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_NOT_FOUND));
          if (config.getApiKey() == null || config.getApiKey().isBlank()) {
              throw new AppException(ErrorCode.PROVIDER_NOT_CONFIGURED);
          }
          router.activate(config);
          return toResponse(config);
      }

      public void delete(String providerStr) {
          AiProvider provider = parseProvider(providerStr);
          AiProviderConfig config = repository.findByProvider(provider)
                  .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_NOT_FOUND));
          if (config.isActive()) throw new AppException(ErrorCode.PROVIDER_ACTIVE);
          repository.delete(config);
      }

      public List<AiProviderConfigResponse> listAll() {
          return repository.findAll().stream().map(this::toResponse).toList();
      }

      public AiProviderConfigResponse getActive() {
          return repository.findByActiveTrue()
                  .map(this::toResponse)
                  .orElseThrow(() -> new AppException(ErrorCode.PROVIDER_NOT_CONFIGURED));
      }

      private AiProvider parseProvider(String value) {
          try {
              return AiProvider.from(value);
          } catch (IllegalArgumentException e) {
              throw new AppException(ErrorCode.PROVIDER_NOT_FOUND);
          }
      }

      private AiProviderConfigResponse toResponse(AiProviderConfig c) {
          return AiProviderConfigResponse.builder()
                  .provider(c.getProvider())
                  .model(c.getModel())
                  .baseUrl(c.getBaseUrl())
                  .deploymentName(c.getDeploymentName())
                  .active(c.isActive())
                  .configured(c.getApiKey() != null && !c.getApiKey().isBlank())
                  .updatedAt(c.getUpdatedAt())
                  .build();
      }
  }
  ```

- [ ] **Step 5: Run tests to verify they pass**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiAdminServiceTest -q 2>&1 | tail -5
  ```

  Expected: BUILD SUCCESS, Tests run: 7, Failures: 0.

- [ ] **Step 6: Commit**

  ```bash
  git add ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/features/admin/ \
          ai_engine_service/src/test/java/vn/chuongpl/ai_engine_service/features/admin/AiAdminServiceTest.java
  git commit -m "feat(ai-service): add AiAdminService with upsert/activate/delete/list"
  ```

---

### Task 8: AiAdminController

**Files:**
- Create: `features/admin/AiAdminController.java`
- Create: `test/features/admin/AiAdminControllerTest.java`

- [ ] **Step 1: Write the failing test**

  Create `src/test/java/vn/chuongpl/ai_engine_service/features/admin/AiAdminControllerTest.java`:

  ```java
  package vn.chuongpl.ai_engine_service.features.admin;

  import org.junit.jupiter.api.Test;
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
  import org.springframework.security.test.context.support.WithMockUser;
  import org.springframework.test.context.bean.override.mockito.MockitoBean;
  import org.springframework.test.web.servlet.MockMvc;
  import vn.chuongpl.ai_engine_service.model.AiProvider;
  import vn.chuongpl.ai_engine_service.security.InternalAuthFilter;

  import java.util.List;

  import static org.mockito.Mockito.*;
  import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
  import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

  @WebMvcTest(AiAdminController.class)
  class AiAdminControllerTest {

      @Autowired MockMvc mvc;
      @MockitoBean AiAdminService adminService;
      @MockitoBean InternalAuthFilter internalAuthFilter;  // prevent 401 from filter

      @Test
      @WithMockUser(authorities = "ROLE_ADMIN")
      void listProviders_admin_returns_200() throws Exception {
          when(adminService.listAll()).thenReturn(List.of());

          mvc.perform(get("/api/ai/admin/providers"))
              .andExpect(status().isOk());
      }

      @Test
      @WithMockUser(authorities = "ROLE_CANDIDATE")
      void listProviders_non_admin_returns_403() throws Exception {
          mvc.perform(get("/api/ai/admin/providers"))
              .andExpect(status().isForbidden());
      }

      @Test
      @WithMockUser(authorities = "ROLE_ADMIN")
      void activateProvider_admin_calls_service_and_returns_200() throws Exception {
          var response = AiProviderConfigResponse.builder()
                  .provider(AiProvider.GEMINI).active(true).configured(true).build();
          when(adminService.activate("gemini")).thenReturn(response);

          mvc.perform(put("/api/ai/admin/providers/gemini/activate"))
              .andExpect(status().isOk())
              .andExpect(jsonPath("$.data.provider").value("GEMINI"))
              .andExpect(jsonPath("$.data.active").value(true));

          verify(adminService).activate("gemini");
      }

      @Test
      @WithMockUser(authorities = "ROLE_ADMIN")
      void deleteProvider_admin_returns_200() throws Exception {
          doNothing().when(adminService).delete("groq");

          mvc.perform(delete("/api/ai/admin/providers/groq"))
              .andExpect(status().isOk());

          verify(adminService).delete("groq");
      }

      @Test
      @WithMockUser(authorities = "ROLE_ADMIN")
      void getActiveProvider_returns_active_response() throws Exception {
          var response = AiProviderConfigResponse.builder()
                  .provider(AiProvider.GEMINI).active(true).configured(true).build();
          when(adminService.getActive()).thenReturn(response);

          mvc.perform(get("/api/ai/admin/providers/active"))
              .andExpect(status().isOk())
              .andExpect(jsonPath("$.data.active").value(true));
      }
  }
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiAdminControllerTest -q 2>&1 | tail -8
  ```

  Expected: FAIL — `AiAdminController` does not exist.

- [ ] **Step 3: Implement AiAdminController**

  Create `src/main/java/vn/chuongpl/ai_engine_service/features/admin/AiAdminController.java`:

  ```java
  package vn.chuongpl.ai_engine_service.features.admin;

  import lombok.RequiredArgsConstructor;
  import org.springframework.security.access.prepost.PreAuthorize;
  import org.springframework.web.bind.annotation.*;
  import vn.chuongpl.ai_engine_service.dtos.ApiResponse;

  import java.util.List;

  @RestController
  @RequestMapping("/api/ai/admin/providers")
  @RequiredArgsConstructor
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  public class AiAdminController {

      private final AiAdminService adminService;

      @GetMapping
      public ApiResponse<List<AiProviderConfigResponse>> listProviders() {
          return ApiResponse.<List<AiProviderConfigResponse>>builder()
                  .data(adminService.listAll())
                  .build();
      }

      @PutMapping("/{provider}")
      public ApiResponse<AiProviderConfigResponse> upsertProvider(
              @PathVariable String provider,
              @RequestBody AiProviderConfigRequest request) {
          return ApiResponse.<AiProviderConfigResponse>builder()
                  .data(adminService.upsert(provider, request))
                  .build();
      }

      @DeleteMapping("/{provider}")
      public ApiResponse<Void> deleteProvider(@PathVariable String provider) {
          adminService.delete(provider);
          return ApiResponse.<Void>builder().message("Provider deleted").build();
      }

      @PutMapping("/{provider}/activate")
      public ApiResponse<AiProviderConfigResponse> activateProvider(@PathVariable String provider) {
          return ApiResponse.<AiProviderConfigResponse>builder()
                  .data(adminService.activate(provider))
                  .build();
      }

      @GetMapping("/active")
      public ApiResponse<AiProviderConfigResponse> getActiveProvider() {
          return ApiResponse.<AiProviderConfigResponse>builder()
                  .data(adminService.getActive())
                  .build();
      }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  cd ai_engine_service && ./mvnw test -Dtest=AiAdminControllerTest -q 2>&1 | tail -5
  ```

  Expected: BUILD SUCCESS, Tests run: 5, Failures: 0.

- [ ] **Step 5: Commit**

  ```bash
  git add ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/features/admin/AiAdminController.java \
          ai_engine_service/src/test/java/vn/chuongpl/ai_engine_service/features/admin/AiAdminControllerTest.java
  git commit -m "feat(ai-service): add AiAdminController with 5 admin-only endpoints"
  ```

---

### Task 9: Wire AnalysisService — Delete AiConfig, Swap ChatClient

**Files:**
- Delete: `config/AiConfig.java`
- Modify: `features/analysis/AnalysisService.java`

This task removes the `ChatClient` bean (created by the old `AiConfig`) and replaces it with `AiModelGatewayRouter` in `AnalysisService`. No logic changes to any analysis method — only `callAi()` changes.

- [ ] **Step 1: Delete AiConfig.java**

  ```bash
  rm ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/config/AiConfig.java
  ```

- [ ] **Step 2: Update AnalysisService.java**

  In `AnalysisService.java`, make exactly two changes:

  **Change 1** — replace the `ChatClient` import and field. Remove:
  ```java
  import org.springframework.ai.chat.client.ChatClient;
  ```
  Add:
  ```java
  import vn.chuongpl.ai_engine_service.model.AiModelGatewayRouter;
  ```

  Replace field:
  ```java
  // BEFORE
  private final ChatClient chatClient;

  // AFTER
  private final AiModelGatewayRouter modelRouter;
  ```

  **Change 2** — rewrite `callAi()` (lines 179–190):
  ```java
  private String callAi(String prompt) {
      try {
          return modelRouter.call(promptBuilder.systemPrompt(), prompt);
      } catch (AppException e) {
          throw e;
      } catch (Exception e) {
          log.error("AI call failed: {}", e.getMessage());
          throw new AppException(ErrorCode.AI_PROCESSING_FAILED);
      }
  }
  ```

  All other methods (`analyze`, `improve`, `recommend`, etc.) are unchanged — they all delegate to `callAi(prompt)`.

- [ ] **Step 3: Compile check**

  ```bash
  cd ai_engine_service && ./mvnw compile -q
  ```

  Expected: BUILD SUCCESS. If there is a `NoSuchBeanDefinitionException` for `ChatClient` anywhere, search for any remaining `ChatClient` injection with:
  ```bash
  grep -r "ChatClient" ai_engine_service/src/main/ --include="*.java"
  ```

- [ ] **Step 4: Run all tests**

  ```bash
  cd ai_engine_service && ./mvnw test -q 2>&1 | tail -10
  ```

  Expected: BUILD SUCCESS, all tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add -u ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/features/analysis/AnalysisService.java
  git rm ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/config/AiConfig.java
  git commit -m "feat(ai-service): wire AnalysisService to AiModelGatewayRouter, remove AiConfig"
  ```

---

### Task 10: Cleanup .env.example + application.yaml

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update .env.example**

  In `.env.example`, find the AI engine config section:
  ```
  # ai engine config (API key, no local model)
  AI_BASE_URL=https://api.groq.com/openai
  AI_API_KEY=your_api_key_here
  AI_MODEL=llama-3.1-8b-instant
  AI_RECOMMEND_BATCH=20
  ```

  Replace with:
  ```
  # ai engine config
  # Provider credentials are configured via the Admin API after service startup.
  # PUT /ai/api/ai/admin/providers/{provider} with {"apiKey", "model", "baseUrl"}
  # PUT /ai/api/ai/admin/providers/{provider}/activate to activate a provider
  # Supported providers: groq | gemini | anthropic | azure_openai
  AI_RECOMMEND_BATCH=20
  AI_MONGO_DB_NAME=ai_engine_db
  ```

- [ ] **Step 2: Run full test suite one final time**

  ```bash
  cd ai_engine_service && ./mvnw test -q 2>&1 | tail -10
  ```

  Expected: BUILD SUCCESS, all tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add .env.example
  git commit -m "docs: update .env.example for DB-backed AI provider config"
  ```

---

## Summary

| Task | What it builds | Tests |
|------|---------------|-------|
| 1 | pom, yaml, ErrorCode, Mockito setup | — |
| 2 | `AiProvider` enum | 5 |
| 3 | `AiProviderConfig` document + repo | — |
| 4 | `AiModelGateway` + 4 implementations | — |
| 5 | `AiModelGatewayFactory` | 4 |
| 6 | `AiModelGatewayRouter` | 6 |
| 7 | DTOs + `AiAdminService` | 7 |
| 8 | `AiAdminController` | 5 |
| 9 | Wire `AnalysisService`, delete `AiConfig` | (all pass) |
| 10 | `.env.example` cleanup | — |

**Total new tests:** 27
