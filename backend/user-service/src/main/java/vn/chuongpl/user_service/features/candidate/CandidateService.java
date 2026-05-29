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
import vn.chuongpl.user_service.features.user.User;
import vn.chuongpl.user_service.features.user.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CandidateService {
    CandidateRepository candidateRepository;
    UserRepository userRepository;
    CandidateMapper candidateMapper;

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
}
