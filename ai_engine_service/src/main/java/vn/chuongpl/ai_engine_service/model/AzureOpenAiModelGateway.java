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
