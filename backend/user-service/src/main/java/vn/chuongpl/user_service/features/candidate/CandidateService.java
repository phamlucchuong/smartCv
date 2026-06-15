package vn.chuongpl.user_service.features.candidate;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.dtos.request.CandidateRequest;
import vn.chuongpl.user_service.dtos.response.CandidateResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.candidate.settings.CandidateSettings;
import vn.chuongpl.user_service.features.candidate.settings.NotificationPreferences;
import vn.chuongpl.user_service.features.candidate.settings.PrivacySettings;
import vn.chuongpl.user_service.features.user.User;
import vn.chuongpl.user_service.features.user.UserRepository;
import vn.chuongpl.user_service.integration.job.JobClient;
import vn.chuongpl.user_service.integration.job.JobSummary;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CandidateService {
    CandidateRepository candidateRepository;
    UserRepository userRepository;
    CandidateMapper candidateMapper;
    JobClient jobClient;
    S3Service s3Service;

    public CandidateResponse create(CandidateRequest request) {
        User user = userRepository.findById(request.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (candidateRepository.findByUserIdAndDeletedFalse(request.getUserId()).isPresent()) throw new AppException(ErrorCode.CANDIDATE_EXISTED);

        Candidate candidate = candidateMapper.toCandidate(request);
        candidate.setCreatedAt(LocalDateTime.now());
        candidate.setUpdatedAt(LocalDateTime.now());
        candidate.setDeleted(false);

        return candidateMapper.toCandidateResponse(candidateRepository.save(candidate), user);
    }

    public void createBasicProfile(String userId) {
        if (candidateRepository.findByUserIdAndDeletedFalse(userId).isPresent()) return;
        Candidate candidate = Candidate.builder().userId(userId).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).deleted(false).build();
        candidateRepository.save(candidate);
    }

    public CandidateResponse getById(String id) {
        Candidate candidate = candidateRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        User user = userRepository.findById(candidate.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return candidateMapper.toCandidateResponse(candidate, user);
    }

    public CandidateResponse getByUserId(String userId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId).orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return candidateMapper.toCandidateResponse(candidate, user);
    }

    public PageResponse<CandidateResponse> getAll(int page, int size) {
        int pageCurrent = page > 0 ? page - 1 : 0;
        int safeSize = size > 0 ? size : 10;
        Pageable pageable = PageRequest.of(pageCurrent, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Candidate> candidates = candidateRepository.findAllByDeletedFalse(pageable);

        return PageResponse.<CandidateResponse>builder()
                .items(candidates.getContent().stream().map(candidate -> {
                    User user = userRepository.findById(candidate.getUserId()).orElse(null);
                    return candidateMapper.toCandidateResponse(candidate, user);
                }).toList())
                .total(candidates.getTotalElements())
                .page(pageCurrent + 1)
                .pageSize(safeSize)
                .totalPages(candidates.getTotalPages())
                .build();
    }

    public CandidateResponse update(String id, CandidateRequest request, String currentUserId, boolean isAdmin) {
        Candidate candidate = candidateRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        if (!isAdmin && !candidate.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        User user = userRepository.findById(candidate.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        String fixedUserId = candidate.getUserId();
        candidateMapper.updateCandidate(candidate, request);
        candidate.setUserId(fixedUserId);
        candidate.setUpdatedAt(LocalDateTime.now());
        return candidateMapper.toCandidateResponse(candidateRepository.save(candidate), user);
    }

    public CandidateResponse getMe(String userId) {
        return getByUserId(userId);
    }

    public String uploadAvatar(String userId, org.springframework.web.multipart.MultipartFile file) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        String avatarUrl = s3Service.uploadAvatar(file, userId);
        candidate.setAvatarUrl(avatarUrl);
        candidate.setUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
        return avatarUrl;
    }

    public CandidateResponse saveCvUrl(String userId, String cvUrl) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        candidate.setCvUrl(cvUrl);
        candidate.setUpdatedAt(LocalDateTime.now());
        return candidateMapper.toCandidateResponse(candidateRepository.save(candidate), user);
    }

    public void mergeSkills(String userId, List<String> newSkills) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));

        List<String> existing = candidate.getSkills() != null
                ? new ArrayList<>(candidate.getSkills())
                : new ArrayList<>();

        Set<String> existingLower = existing.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(s -> s.toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (newSkills != null) {
            for (String skill : newSkills) {
                if (skill == null || skill.isBlank()) {
                    continue;
                }
                String normalized = skill.toLowerCase(Locale.ROOT);
                if (!existingLower.contains(normalized)) {
                    existing.add(skill);
                    existingLower.add(normalized);
                }
            }
        }

        candidate.setSkills(existing);
        candidate.setUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
    }

    public void delete(String id) {
        Candidate candidate = candidateRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        candidate.setDeleted(true);
        candidate.setDeletedAt(LocalDateTime.now());
        candidate.setUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
    }

    // ── CV Management ─────────────────────────────────────────────────────────

    public List<CvItem> listCvs(String userId) {
        List<CvItem> cvs = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND))
                .getCvs();
        cvs.forEach(cv -> {
            if (cv.getS3Key() != null) {
                cv.setUrl(s3Service.generateFreshUrl(cv.getS3Key()));
            }
        });
        return cvs;
    }

    public void addCvToList(String userId, String s3Key, String url, String filename) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        boolean isFirst = candidate.getCvs().isEmpty();
        CvItem item = CvItem.builder()
                .id(UUID.randomUUID().toString())
                .s3Key(s3Key)
                .url(url)
                .filename(filename)
                .isDefault(isFirst)
                .uploadedAt(LocalDateTime.now())
                .build();
        candidate.getCvs().add(item);
        if (isFirst) candidate.setCvUrl(url);
        candidate.setUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
    }

    public void setDefaultCv(String userId, String cvId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        CvItem target = candidate.getCvs().stream()
                .filter(cv -> cvId.equals(cv.getId()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND));
        candidate.getCvs().forEach(cv -> cv.setDefault(false));
        target.setDefault(true);
        candidate.setCvUrl(target.getUrl());
        candidate.setUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
    }

    public void deleteCv(String userId, String cvId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        CvItem toRemove = candidate.getCvs().stream()
                .filter(cv -> cvId.equals(cv.getId()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND));
        boolean wasDefault = toRemove.isDefault();
        candidate.getCvs().remove(toRemove);
        if (wasDefault && !candidate.getCvs().isEmpty()) {
            CvItem next = candidate.getCvs().stream()
                    .max(Comparator.comparing(CvItem::getUploadedAt))
                    .orElse(candidate.getCvs().get(0));
            next.setDefault(true);
            candidate.setCvUrl(next.getUrl());
        }
        candidate.setUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
    }

    public String refreshCvUrl(String userId, String cvId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        CvItem cv = candidate.getCvs().stream()
                .filter(c -> cvId.equals(c.getId()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND));
        if (cv.getS3Key() == null) return cv.getUrl();
        return s3Service.generateFreshUrl(cv.getS3Key());
    }

    public CvItem getCvAnalysis(String userId, String cvId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        return candidate.getCvs().stream()
                .filter(cv -> cvId.equals(cv.getId()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND));
    }

    public void markCvReanalyzing(String userId, String cvId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        candidate.getCvs().stream()
                .filter(cv -> cvId.equals(cv.getId()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND))
                .setAnalysisStatus(CvAnalysisStatus.PENDING);
        candidateRepository.save(candidate);
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    public CandidateSettings getSettings(String userId) {
        return candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND))
                .getSettings();
    }

    public void updateNotificationPreferences(String userId, NotificationPreferences prefs) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        candidate.getSettings().setNotifications(prefs);
        candidate.setUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
    }

    public void updatePrivacySettings(String userId, PrivacySettings privacy) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        candidate.getSettings().setPrivacy(privacy);
        candidate.setUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
    }

    public void deleteAccount(String userId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        candidate.setDeleted(true);
        candidate.setDeletedAt(LocalDateTime.now());
        candidate.setUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
        user.setDeleted(true);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // ── Job Suggestions ───────────────────────────────────────────────────────

    public List<JobSuggestion> getJobSuggestions(String userId) {
        return candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND))
                .getJobSuggestions();
    }

    public List<EnrichedJobSuggestion> getEnrichedJobSuggestions(String userId) {
        List<JobSuggestion> suggestions = getJobSuggestions(userId);
        if (suggestions.isEmpty()) return List.of();

        List<String> jobIds = suggestions.stream().map(JobSuggestion::getJobId).toList();
        Map<String, JobSummary> jobMap = jobClient.getJobsByIds(jobIds).stream()
                .collect(Collectors.toMap(JobSummary::getId, j -> j));

        return suggestions.stream()
                .map(s -> EnrichedJobSuggestion.builder()
                        .jobId(s.getJobId())
                        .matchScore(s.getMatchScore())
                        .matchReason(s.getMatchReason())
                        .alignedSkills(s.getAlignedSkills())
                        .suggestedAt(s.getSuggestedAt())
                        .job(jobMap.get(s.getJobId()))
                        .build())
                .toList();
    }

    public void updateJobSuggestions(String userId, List<JobSuggestion> suggestions) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        candidate.setJobSuggestions(suggestions);
        candidate.setSuggestionsUpdatedAt(LocalDateTime.now());
        candidateRepository.save(candidate);
    }

    // ── Company Follow ────────────────────────────────────────────────────────

    public void followCompany(String userId, String companyId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        if (!candidate.getFollowedCompanyIds().contains(companyId)) {
            candidate.getFollowedCompanyIds().add(companyId);
            candidateRepository.save(candidate);
        }
    }

    public void unfollowCompany(String userId, String companyId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        candidate.getFollowedCompanyIds().remove(companyId);
        candidateRepository.save(candidate);
    }

    public List<String> getFollowedCompanyIds(String userId) {
        return candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND))
                .getFollowedCompanyIds();
    }
}
