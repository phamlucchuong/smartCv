package vn.chuongpl.ai_engine_service.model;

public enum AiProvider {
    GROQ, AZURE_OPENAI, ANTHROPIC, GEMINI, LLAMA_3, CLAUDE_AGENT_SDK;

    public static AiProvider from(String value) {
        return switch (value.trim().toLowerCase()) {
            case "groq"                                  -> GROQ;
            case "azure", "azure_openai", "azure-openai" -> AZURE_OPENAI;
            case "anthropic", "claude"                   -> ANTHROPIC;
            case "gemini", "google", "google_gemini"     -> GEMINI;
            case "llama", "llama3", "llama_3", "llama-3" -> LLAMA_3;
            case "claude_agent_sdk", "claude-agent-sdk"  -> CLAUDE_AGENT_SDK;
            default -> throw new IllegalArgumentException("Unknown AI provider: " + value);
        };
    }
}
