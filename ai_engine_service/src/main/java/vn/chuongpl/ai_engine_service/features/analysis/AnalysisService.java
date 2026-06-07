package vn.chuongpl.ai_engine_service.features.analysis;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.chuongpl.ai_engine_service.dtos.request.CvAnalyzeRequest;
import vn.chuongpl.ai_engine_service.dtos.request.CvImproveRequest;
import vn.chuongpl.ai_engine_service.dtos.request.InterviewQuestionsRequest;
import vn.chuongpl.ai_engine_service.dtos.request.JobRecommendRequest;
import vn.chuongpl.ai_engine_service.dtos.response.CvAnalysisResponse;
import vn.chuongpl.ai_engine_service.dtos.response.CvImprovementResponse;
import vn.chuongpl.ai_engine_service.dtos.response.InterviewQuestionsResponse;
import vn.chuongpl.ai_engine_service.dtos.response.JobRecommendationResponse;
import vn.chuongpl.ai_engine_service.dtos.response.SkillExtractionResponse;
import vn.chuongpl.ai_engine_service.enums.ErrorCode;
import vn.chuongpl.ai_engine_service.exception.AppException;
import vn.chuongpl.ai_engine_service.integration.cv.CvTextExtractor;
import vn.chuongpl.ai_engine_service.integration.job.JobClient;
import vn.chuongpl.ai_engine_service.integration.job.JobSummary;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final ChatClient chatClient;
    private final PromptBuilder promptBuilder;
    private final CvTextExtractor cvTextExtractor;
    private final JobClient jobClient;

    @Value("${app.ai.recommend-batch-size:20}")
    private int recommendBatchSize;

    private final ObjectMapper mapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public CvAnalysisResponse analyze(CvAnalyzeRequest request) {
        String cvText = cvTextExtractor.resolveCvText(request.cvText(), request.cvUrl());
        JobSummary job = jobClient.getJobById(request.jobId());
        return analyzeCvText(cvText, job);
    }

    public CvAnalysisResponse analyzeUploadedCv(MultipartFile file, String jobId) {
        if (jobId == null || jobId.isBlank()) {
            throw new AppException(ErrorCode.JOB_ID_REQUIRED);
        }

        String cvText = cvTextExtractor.extractFromUpload(file);
        JobSummary job = jobClient.getJobById(jobId);
        return analyzeCvText(cvText, job);
    }

    private CvAnalysisResponse analyzeCvText(String cvText, JobSummary job) {
        String prompt = promptBuilder.buildAnalyzePrompt(Map.of(
                "CV_TEXT", cvText,
                "JOB_TITLE", nvl(job.title()),
                "JOB_DESCRIPTION", nvl(job.description()),
                "JOB_SKILLS", String.join(", ", safeList(job.skills())),
                "JOB_REQUIREMENTS", String.join("\n- ", safeList(job.requirements())),
                "EXPERIENCE_LEVEL", nvl(job.experienceLevel())
        ));

        String aiContent = callAi(prompt);
        return parse(aiContent, CvAnalysisResponse.class);
    }

    public CvAnalysisResponse autoScore(String cvUrl, String jobId) {
        String cvText = cvTextExtractor.resolveCvText(null, cvUrl);
        JobSummary job = jobClient.getJobById(jobId);

        String prompt = promptBuilder.buildAnalyzePrompt(Map.of(
                "CV_TEXT", cvText,
                "JOB_TITLE", nvl(job.title()),
                "JOB_DESCRIPTION", nvl(job.description()),
                "JOB_SKILLS", String.join(", ", safeList(job.skills())),
                "JOB_REQUIREMENTS", String.join("\n- ", safeList(job.requirements())),
                "EXPERIENCE_LEVEL", nvl(job.experienceLevel())
        ));

        String aiContent = callAi(prompt);
        return parse(aiContent, CvAnalysisResponse.class);
    }

    public SkillExtractionResponse extractSkills(String cvUrl) {
        String cvText = cvTextExtractor.resolveCvText(null, cvUrl);
        String prompt = promptBuilder.buildExtractSkillsPrompt(Map.of("CV_TEXT", cvText));
        String aiContent = callAi(prompt);
        return parse(aiContent, SkillExtractionResponse.class);
    }

    public CvImprovementResponse improve(CvImproveRequest request) {
        String cvText = cvTextExtractor.resolveCvText(request.cvText(), request.cvUrl());
        JobSummary job = jobClient.getJobById(request.jobId());

        String prompt = promptBuilder.buildImprovePrompt(Map.of(
                "CV_TEXT", cvText,
                "JOB_TITLE", nvl(job.title()),
                "JOB_DESCRIPTION", nvl(job.description()),
                "JOB_SKILLS", String.join(", ", safeList(job.skills())),
                "JOB_REQUIREMENTS", String.join("\n- ", safeList(job.requirements()))
        ));

        String aiContent = callAi(prompt);
        return parse(aiContent, CvImprovementResponse.class);
    }

    public JobRecommendationResponse recommend(JobRecommendRequest request) {
        String cvText = cvTextExtractor.resolveCvText(request.cvText(), request.cvUrl());
        int topK = request.topK() == null ? 5 : request.topK();

        if (topK < 1 || topK > 50) {
            throw new AppException(ErrorCode.INVALID_TOP_K);
        }

        List<JobSummary> jobs = jobClient.getActiveJobs(0, recommendBatchSize);
        String jobsJson;
        try {
            jobsJson = mapper.writeValueAsString(jobs);
        } catch (Exception e) {
            jobsJson = "[]";
        }

        String prompt = promptBuilder.buildRecommendPrompt(Map.of(
                "CV_TEXT", cvText,
                "JOBS_JSON", jobsJson
        )) + "\n\nTop-K: " + topK;

        String aiContent = callAi(prompt);
        return parse(aiContent, JobRecommendationResponse.class);
    }

    public InterviewQuestionsResponse generateInterviewQuestions(InterviewQuestionsRequest request) {
        if ((request.cvText() == null || request.cvText().isBlank())
                && (request.cvUrl() == null || request.cvUrl().isBlank())) {
            throw new AppException(ErrorCode.CV_TEXT_REQUIRED);
        }

        String cvText = cvTextExtractor.resolveCvText(request.cvText(), request.cvUrl());
        JobSummary job = jobClient.getJobById(request.jobId());

        String prompt = promptBuilder.buildInterviewQuestionsPrompt(Map.of(
                "CV_TEXT", cvText,
                "JOB_TITLE", nvl(job.title()),
                "JOB_DESCRIPTION", nvl(job.description()),
                "JOB_SKILLS", String.join(", ", safeList(job.skills())),
                "JOB_REQUIREMENTS", String.join("\n- ", safeList(job.requirements()))
        ));

        String aiContent = callAi(prompt);
        return parse(aiContent, InterviewQuestionsResponse.class);
    }

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

    private <T> T parse(String raw, Class<T> clazz) {
        try {
            String normalized = extractJson(raw);
            return mapper.readValue(normalized, clazz);
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", raw);
            throw new AppException(ErrorCode.AI_PROCESSING_FAILED);
        }
    }

    private String extractJson(String raw) {
        String trimmed = raw == null ? "" : raw.trim();
        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
            trimmed = trimmed.replaceFirst("^```json", "").replaceFirst("^```", "");
            trimmed = trimmed.substring(0, trimmed.lastIndexOf("```"));
        }
        return trimmed.trim();
    }

    private String nvl(String value) {
        return value == null ? "" : value;
    }

    private List<String> safeList(List<String> values) {
        return values == null ? Collections.emptyList() : values;
    }
}
