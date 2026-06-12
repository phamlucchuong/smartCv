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
