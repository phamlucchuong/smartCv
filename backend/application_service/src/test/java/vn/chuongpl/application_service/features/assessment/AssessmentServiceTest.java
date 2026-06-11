package vn.chuongpl.application_service.features.assessment;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.application_service.dtos.request.AssessmentAnswerRequest;
import vn.chuongpl.application_service.dtos.request.AssessmentCreateRequest;
import vn.chuongpl.application_service.dtos.response.AssessmentResultResponse;
import vn.chuongpl.application_service.dtos.response.AssessmentResponse;
import vn.chuongpl.application_service.dtos.response.AttemptStateResponse;
import vn.chuongpl.application_service.enums.*;
import vn.chuongpl.application_service.exception.AppException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {
    @Mock AssessmentRepository assessmentRepository;
    @Mock AssessmentAttemptRepository attemptRepository;
    @InjectMocks AssessmentService assessmentService;

    @Test
    void createAssessment_shouldSaveWithDraftStatusAndReturnResponse() {
        AssessmentCreateRequest req = new AssessmentCreateRequest();
        req.setTitle("Java Test");
        req.setDescription("Basic Java knowledge");
        req.setQuestions(List.of());
        req.setTimeLimitMinutes(30);

        Assessment saved = Assessment.builder()
                .id("a1").title("Java Test").status(AssessmentStatus.DRAFT)
                .recruiterId("r1").createdAt(LocalDateTime.now()).build();
        when(assessmentRepository.save(any(Assessment.class))).thenReturn(saved);

        AssessmentResponse response = assessmentService.createAssessment(req, "r1");

        assertEquals("a1", response.getId());
        assertEquals(AssessmentStatus.DRAFT, response.getStatus());
        verify(assessmentRepository).save(any(Assessment.class));
    }

    @Test
    void assignToCandidate_shouldCreateInProgressAttemptAndActivateAssessment() {
        Assessment assessment = Assessment.builder()
                .id("a1").recruiterId("r1").status(AssessmentStatus.DRAFT).build();
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        when(attemptRepository.save(any(AssessmentAttempt.class))).thenAnswer(i -> i.getArgument(0));
        when(assessmentRepository.save(any(Assessment.class))).thenReturn(assessment);

        assessmentService.assignToCandidate("a1", "c1", "r1");

        ArgumentCaptor<AssessmentAttempt> captor = ArgumentCaptor.forClass(AssessmentAttempt.class);
        verify(attemptRepository).save(captor.capture());
        assertEquals("c1", captor.getValue().getCandidateId());
        assertEquals(AttemptStatus.IN_PROGRESS, captor.getValue().getStatus());

        assertEquals(AssessmentStatus.ACTIVE, assessment.getStatus());
    }

    @Test
    void startAttempt_shouldCreateNewAttemptAndReturnAttemptId() {
        Assessment assessment = Assessment.builder().id("a1").status(AssessmentStatus.ACTIVE).build();
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        when(attemptRepository.findByCandidateIdAndAssessmentIdAndStatus("c1", "a1", AttemptStatus.IN_PROGRESS))
                .thenReturn(Optional.empty());
        AssessmentAttempt saved = AssessmentAttempt.builder().id("att1").build();
        when(attemptRepository.save(any(AssessmentAttempt.class))).thenReturn(saved);

        String attemptId = assessmentService.startAttempt("a1", "c1");

        assertEquals("att1", attemptId);
    }

    @Test
    void startAttempt_shouldThrowWhenAttemptAlreadyInProgress() {
        Assessment assessment = Assessment.builder().id("a1").status(AssessmentStatus.ACTIVE).build();
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        AssessmentAttempt existing = AssessmentAttempt.builder().id("att1").status(AttemptStatus.IN_PROGRESS).build();
        when(attemptRepository.findByCandidateIdAndAssessmentIdAndStatus("c1", "a1", AttemptStatus.IN_PROGRESS))
                .thenReturn(Optional.of(existing));

        AppException ex = assertThrows(AppException.class, () -> assessmentService.startAttempt("a1", "c1"));
        assertEquals(ErrorCode.ATTEMPT_ALREADY_IN_PROGRESS, ex.getErrorCode());
    }

    @Test
    void saveAnswers_shouldReplaceAnswerListAndPersist() {
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").status(AttemptStatus.IN_PROGRESS)
                .answers(new ArrayList<>()).build();
        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));

        AssessmentAnswerRequest req = new AssessmentAnswerRequest();
        req.setAnswers(List.of(new AttemptAnswer("q1", 2, null)));

        assessmentService.saveAnswers("att1", req, "c1");

        assertEquals(1, attempt.getAnswers().size());
        assertEquals("q1", attempt.getAnswers().get(0).getQuestionId());
        verify(attemptRepository).save(attempt);
    }

    @Test
    void saveAnswers_shouldThrowWhenAttemptAlreadySubmitted() {
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").status(AttemptStatus.SUBMITTED).build();
        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));

        AppException ex = assertThrows(AppException.class,
                () -> assessmentService.saveAnswers("att1", new AssessmentAnswerRequest(), "c1"));
        assertEquals(ErrorCode.ATTEMPT_ALREADY_SUBMITTED, ex.getErrorCode());
    }

    @Test
    void submitAttempt_shouldGradeMcqQuestionsAndSetPassResult() {
        Question q1 = Question.builder().id("q1").type(QuestionType.MCQ).correctOptionIndex(1).build();
        Question q2 = Question.builder().id("q2").type(QuestionType.MCQ).correctOptionIndex(0).build();
        Assessment assessment = Assessment.builder().id("a1")
                .questions(List.of(q1, q2)).build();

        AttemptAnswer ans1 = new AttemptAnswer("q1", 1, null);
        AttemptAnswer ans2 = new AttemptAnswer("q2", 1, null);
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").assessmentId("a1")
                .status(AttemptStatus.IN_PROGRESS)
                .answers(new ArrayList<>(List.of(ans1, ans2))).build();

        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        when(attemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assessmentService.submitAttempt("att1", "c1");

        assertEquals(AttemptStatus.SUBMITTED, attempt.getStatus());
        assertEquals(50.0, attempt.getScore());
        assertEquals(AttemptResult.FAIL, attempt.getResult());
        assertNotNull(attempt.getSubmittedAt());
    }

    @Test
    void submitAttempt_shouldSetPendingResultWhenTextQuestionsPresent() {
        Question q1 = Question.builder().id("q1").type(QuestionType.MCQ).correctOptionIndex(0).build();
        Question q2 = Question.builder().id("q2").type(QuestionType.TEXT).build();
        Assessment assessment = Assessment.builder().id("a1").questions(List.of(q1, q2)).build();

        AttemptAnswer ans1 = new AttemptAnswer("q1", 0, null);
        AttemptAnswer ans2 = new AttemptAnswer("q2", null, "My answer");
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").assessmentId("a1")
                .status(AttemptStatus.IN_PROGRESS)
                .answers(new ArrayList<>(List.of(ans1, ans2))).build();

        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        when(attemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assessmentService.submitAttempt("att1", "c1");

        assertEquals(AttemptResult.PENDING, attempt.getResult());
    }

    @Test
    void getResult_shouldThrowWhenAttemptNotYetSubmitted() {
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").status(AttemptStatus.IN_PROGRESS).build();
        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));

        AppException ex = assertThrows(AppException.class,
                () -> assessmentService.getResult("att1", "c1"));
        assertEquals(ErrorCode.ATTEMPT_NOT_SUBMITTED, ex.getErrorCode());
    }
}
