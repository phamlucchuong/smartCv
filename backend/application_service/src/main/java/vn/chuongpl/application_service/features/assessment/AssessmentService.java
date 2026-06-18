package vn.chuongpl.application_service.features.assessment;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.chuongpl.application_service.dtos.request.AssessmentAnswerRequest;
import vn.chuongpl.application_service.dtos.request.AssessmentCreateRequest;
import vn.chuongpl.application_service.dtos.response.AssessmentResponse;
import vn.chuongpl.application_service.dtos.response.AssessmentResultResponse;
import vn.chuongpl.application_service.dtos.response.AttemptStateResponse;
import vn.chuongpl.application_service.enums.*;
import vn.chuongpl.application_service.exception.AppException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AssessmentService {

    AssessmentRepository assessmentRepository;
    AssessmentAttemptRepository attemptRepository;

    public AssessmentResponse createAssessment(AssessmentCreateRequest req, String recruiterId) {
        Assessment assessment = Assessment.builder()
                .recruiterId(recruiterId)
                .jobId(req.getJobId())
                .title(req.getTitle())
                .description(req.getDescription())
                .questions(req.getQuestions() != null ? req.getQuestions() : List.of())
                .timeLimitMinutes(req.getTimeLimitMinutes())
                .status(AssessmentStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .build();
        Assessment saved = assessmentRepository.save(assessment);
        return toResponse(saved);
    }

    public List<AssessmentResponse> getRecruiterAssessments(String recruiterId) {
        return assessmentRepository.findByRecruiterId(recruiterId).stream()
                .map(this::toResponse)
                .toList();
    }

    public AssessmentResponse updateAssessment(String id, AssessmentCreateRequest req, String recruiterId) {
        Assessment assessment = findAssessmentById(id);
        if (!recruiterId.equals(assessment.getRecruiterId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        assessment.setTitle(req.getTitle());
        assessment.setDescription(req.getDescription());
        assessment.setJobId(req.getJobId());
        assessment.setQuestions(req.getQuestions() != null ? req.getQuestions() : List.of());
        assessment.setTimeLimitMinutes(req.getTimeLimitMinutes());
        Assessment saved = assessmentRepository.save(assessment);
        return toResponse(saved);
    }

    public void deleteAssessment(String id, String recruiterId) {
        Assessment assessment = findAssessmentById(id);
        if (!recruiterId.equals(assessment.getRecruiterId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        assessmentRepository.delete(assessment);
    }

    public void assignToCandidate(String assessmentId, String candidateId, String recruiterId) {
        Assessment assessment = findAssessmentById(assessmentId);
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .assessmentId(assessmentId)
                .candidateId(candidateId)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .build();
        attemptRepository.save(attempt);
        if (assessment.getStatus() == AssessmentStatus.DRAFT) {
            assessment.setStatus(AssessmentStatus.ACTIVE);
            assessmentRepository.save(assessment);
        }
    }

    public List<AttemptStateResponse> getMyAssessments(String candidateId) {
        return attemptRepository.findByCandidateId(candidateId).stream()
                .map(this::toAttemptStateResponse)
                .toList();
    }

    public AssessmentResponse getAssessment(String assessmentId) {
        Assessment assessment = findAssessmentById(assessmentId);
        AssessmentResponse response = toResponse(assessment);
        if (response.getQuestions() != null) {
            response.getQuestions().forEach(q -> q.setCorrectOptionIndex(null));
        }
        return response;
    }

    public String startAttempt(String assessmentId, String candidateId) {
        findAssessmentById(assessmentId);
        attemptRepository.findByCandidateIdAndAssessmentIdAndStatus(
                        candidateId, assessmentId, AttemptStatus.IN_PROGRESS)
                .ifPresent(a -> { throw new AppException(ErrorCode.ATTEMPT_ALREADY_IN_PROGRESS); });

        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .assessmentId(assessmentId)
                .candidateId(candidateId)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .build();
        return attemptRepository.save(attempt).getId();
    }

    public void saveAnswers(String attemptId, AssessmentAnswerRequest req, String candidateId) {
        AssessmentAttempt attempt = findAttemptById(attemptId);
        assertOwner(attempt, candidateId);
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ATTEMPT_ALREADY_SUBMITTED);
        }
        attempt.setAnswers(req.getAnswers() != null ? req.getAnswers() : List.of());
        attemptRepository.save(attempt);
    }

    public void submitAttempt(String attemptId, String candidateId) {
        AssessmentAttempt attempt = findAttemptById(attemptId);
        assertOwner(attempt, candidateId);
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ATTEMPT_ALREADY_SUBMITTED);
        }
        Assessment assessment = findAssessmentById(attempt.getAssessmentId());

        Map<String, Question> questionMap = assessment.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        boolean hasText = assessment.getQuestions().stream()
                .anyMatch(q -> q.getType() == QuestionType.TEXT);

        long mcqTotal = assessment.getQuestions().stream()
                .filter(q -> q.getType() == QuestionType.MCQ).count();
        long mcqCorrect = attempt.getAnswers().stream()
                .filter(a -> {
                    Question q = questionMap.get(a.getQuestionId());
                    return q != null && q.getType() == QuestionType.MCQ
                            && q.getCorrectOptionIndex() != null
                            && q.getCorrectOptionIndex().equals(a.getSelectedOptionIndex());
                }).count();

        double score = mcqTotal > 0 ? (double) mcqCorrect / mcqTotal * 100 : 0.0;
        AttemptResult result;
        if (hasText) {
            result = AttemptResult.PENDING;
        } else {
            result = score >= 70 ? AttemptResult.PASS : AttemptResult.FAIL;
        }

        attempt.setScore(score);
        attempt.setResult(result);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());
        attemptRepository.save(attempt);
    }

    public AttemptStateResponse getAttemptState(String attemptId, String candidateId) {
        AssessmentAttempt attempt = findAttemptById(attemptId);
        assertOwner(attempt, candidateId);
        return toAttemptStateResponse(attempt);
    }

    public AssessmentResultResponse getResult(String attemptId, String candidateId) {
        AssessmentAttempt attempt = findAttemptById(attemptId);
        assertOwner(attempt, candidateId);
        if (attempt.getStatus() != AttemptStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ATTEMPT_NOT_SUBMITTED);
        }
        return AssessmentResultResponse.builder()
                .attemptId(attempt.getId())
                .score(attempt.getScore())
                .result(attempt.getResult())
                .submittedAt(attempt.getSubmittedAt())
                .build();
    }

    private Assessment findAssessmentById(String id) {
        return assessmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ASSESSMENT_NOT_FOUND));
    }

    private AssessmentAttempt findAttemptById(String id) {
        return attemptRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));
    }

    private void assertOwner(AssessmentAttempt attempt, String candidateId) {
        if (!candidateId.equals(attempt.getCandidateId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private AssessmentResponse toResponse(Assessment a) {
        return AssessmentResponse.builder()
                .id(a.getId())
                .jobId(a.getJobId())
                .recruiterId(a.getRecruiterId())
                .title(a.getTitle())
                .description(a.getDescription())
                .questions(a.getQuestions())
                .timeLimitMinutes(a.getTimeLimitMinutes())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private AttemptStateResponse toAttemptStateResponse(AssessmentAttempt a) {
        return AttemptStateResponse.builder()
                .attemptId(a.getId())
                .assessmentId(a.getAssessmentId())
                .status(a.getStatus())
                .answers(a.getAnswers())
                .startedAt(a.getStartedAt())
                .build();
    }
}
