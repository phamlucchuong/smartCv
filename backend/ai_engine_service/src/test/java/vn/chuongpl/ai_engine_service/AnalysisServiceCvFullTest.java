package vn.chuongpl.ai_engine_service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.ai_engine_service.dtos.request.CvFullAnalysisRequest;
import vn.chuongpl.ai_engine_service.dtos.response.CvFullAnalysisResponse;
import vn.chuongpl.ai_engine_service.enums.ErrorCode;
import vn.chuongpl.ai_engine_service.exception.AppException;
import vn.chuongpl.ai_engine_service.features.analysis.AnalysisService;
import vn.chuongpl.ai_engine_service.features.analysis.PromptBuilder;
import vn.chuongpl.ai_engine_service.integration.cv.CvTextExtractor;
import vn.chuongpl.ai_engine_service.integration.job.JobClient;
import vn.chuongpl.ai_engine_service.integration.job.JobSummary;
import vn.chuongpl.ai_engine_service.integration.user.CvInfoResponse;
import vn.chuongpl.ai_engine_service.integration.user.JobSuggestionsPublisher;
import vn.chuongpl.ai_engine_service.integration.user.UserClient;
import vn.chuongpl.ai_engine_service.model.AiModelGatewayRouter;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AnalysisServiceCvFullTest {

    @Mock AiModelGatewayRouter modelRouter;
    @Mock PromptBuilder promptBuilder;
    @Mock CvTextExtractor cvTextExtractor;
    @Mock JobClient jobClient;
    @Mock JobSuggestionsPublisher jobSuggestionsPublisher;
    @Mock UserClient userClient;

    @InjectMocks AnalysisService analysisService;

    private static final String CV_TEXT = "John Smith, Java Developer, 5 years Spring Boot";
    private static final String CV_URL = "https://s3.example.com/cv.pdf";
    private static final String CV_ID = "cv-1";
    private static final String USER_ID = "user-1";

    @BeforeEach
    void setUp() {
        when(promptBuilder.systemPrompt()).thenReturn("You are an HR expert.");
    }

    @Test
    void analyzeCv_no_jobId_returns_full_analysis() throws Exception {
        CvInfoResponse cvInfo = new CvInfoResponse(CV_ID, CV_URL, "cv.pdf", USER_ID);
        when(userClient.getCvInfo(CV_ID)).thenReturn(cvInfo);
        when(cvTextExtractor.resolveCvText(null, CV_URL)).thenReturn(CV_TEXT);

        when(promptBuilder.buildExtractJobTargetPrompt(any())).thenReturn("extract prompt");
        when(modelRouter.call(anyString(), eq("extract prompt")))
                .thenReturn("{\"targetPosition\":\"Backend Engineer\",\"targetDomain\":\"Tech\"}");

        when(promptBuilder.buildAnalyzePrompt(any())).thenReturn("analyze prompt");
        when(modelRouter.call(anyString(), eq("analyze prompt")))
                .thenReturn("{\"matchScore\":78,\"scoreLabel\":\"Good\",\"matchedSkills\":[\"Java\"],"
                        + "\"missingSkills\":[\"Kubernetes\"],\"extraSkills\":[\"PHP\"],\"summary\":\"Good match\"}");

        when(promptBuilder.buildImproveStructuredPrompt(any())).thenReturn("improve prompt");
        when(modelRouter.call(anyString(), eq("improve prompt")))
                .thenReturn("{\"strengths\":[{\"area\":\"Tech\",\"detail\":\"Java expert\"}],"
                        + "\"weaknesses\":[{\"area\":\"Cloud\",\"detail\":\"No K8s\"}],"
                        + "\"tips\":[{\"area\":\"Skills\",\"suggestion\":\"Learn K8s\",\"priority\":\"High\"}]}");

        doNothing().when(userClient).updateCvAnalysis(anyString(), anyString(), anyString());

        CvFullAnalysisResponse result = analysisService.analyzeCv(
                new CvFullAnalysisRequest(CV_ID, null), USER_ID);

        assertThat(result.overallScore()).isEqualTo(78);
        assertThat(result.scoreLabel()).isEqualTo("Good");
        assertThat(result.targetPosition()).isEqualTo("Backend Engineer");
        assertThat(result.matchScore()).isEqualTo(78);
        assertThat(result.matchedSkills()).containsExactly("Java");
        assertThat(result.strengths()).hasSize(1);
        assertThat(result.strengths().get(0).area()).isEqualTo("Tech");
        assertThat(result.weaknesses()).hasSize(1);
        assertThat(result.tips()).hasSize(1);
        assertThat(result.tips().get(0).priority()).isEqualTo("High");
        verify(userClient).updateCvAnalysis(eq(CV_ID), anyString(), eq("DONE"));
    }

    @Test
    void analyzeCv_throws_UNAUTHORIZED_when_user_does_not_own_cv() {
        CvInfoResponse cvInfo = new CvInfoResponse(CV_ID, CV_URL, "cv.pdf", "other-user");
        when(userClient.getCvInfo(CV_ID)).thenReturn(cvInfo);

        assertThatThrownBy(() -> analysisService.analyzeCv(
                new CvFullAnalysisRequest(CV_ID, null), USER_ID))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    void computeScoreLabel_returns_correct_labels() {
        assertThat(analysisService.computeScoreLabel(85)).isEqualTo("Excellent");
        assertThat(analysisService.computeScoreLabel(84)).isEqualTo("Good");
        assertThat(analysisService.computeScoreLabel(70)).isEqualTo("Good");
        assertThat(analysisService.computeScoreLabel(69)).isEqualTo("Fair");
        assertThat(analysisService.computeScoreLabel(50)).isEqualTo("Fair");
        assertThat(analysisService.computeScoreLabel(49)).isEqualTo("Poor");
    }
}
