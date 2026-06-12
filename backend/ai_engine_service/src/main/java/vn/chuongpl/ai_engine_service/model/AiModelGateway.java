package vn.chuongpl.ai_engine_service.model;

public interface AiModelGateway {
    String call(String systemPrompt, String userPrompt);
    AiProvider provider();
}
