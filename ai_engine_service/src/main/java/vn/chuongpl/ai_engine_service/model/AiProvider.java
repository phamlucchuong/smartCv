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
