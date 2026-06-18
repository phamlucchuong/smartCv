package vn.chuongpl.user_service.features.recruiter;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.dtos.request.QuotaDeltaRequest;
import vn.chuongpl.user_service.dtos.request.RecruiterRequest;
import vn.chuongpl.user_service.dtos.request.RecruiterStatusRequest;
import vn.chuongpl.user_service.dtos.response.RecruiterProfileResponse;
import vn.chuongpl.user_service.dtos.response.RecruiterResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.user.User;
import vn.chuongpl.user_service.features.user.UserRepository;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class RecruiterService {
    public static final int FREE_TIER_JOB_POST_QUOTA = 10;

    RecruiterRepository recruiterRepository;
    UserRepository userRepository;
    RecruiterMapper recruiterMapper;

    public RecruiterResponse create(RecruiterRequest request) {
        User user = userRepository.findById(request.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (recruiterRepository.findByUserIdAndDeletedFalse(request.getUserId()).isPresent()) throw new AppException(ErrorCode.RECRUITER_EXISTED);

        Recruiter recruiter = recruiterMapper.toRecruiter(request);
        if (request.getQuotaJobPost() == null) {
            recruiter.setQuotaJobPost(FREE_TIER_JOB_POST_QUOTA);
        }
        recruiter.setCreatedAt(LocalDateTime.now());
        recruiter.setUpdatedAt(LocalDateTime.now());
        recruiter.setDeleted(false);

        return recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
    }

    public void createBasicProfile(String userId) {
        createBasicProfile(userId, null);
    }

    public void createBasicProfile(String userId, String companyName) {
        var existingRecruiter = recruiterRepository.findByUserIdAndDeletedFalse(userId);
        if (existingRecruiter.isPresent()) {
            Recruiter recruiter = existingRecruiter.get();
            if (companyName != null && !companyName.isBlank() && !Objects.equals(companyName, recruiter.getCompanyName())) {
                recruiter.setCompanyName(companyName);
                recruiter.setUpdatedAt(LocalDateTime.now());
                recruiterRepository.save(recruiter);
            }
            return;
        }
        Recruiter recruiter = Recruiter.builder()
                .userId(userId)
                .companyName(companyName)
                .quotaJobPost(FREE_TIER_JOB_POST_QUOTA)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .deleted(false)
                .build();
        recruiterRepository.save(recruiter);
    }

    public RecruiterResponse getById(String id) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        User user = userRepository.findById(recruiter.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return recruiterMapper.toRecruiterResponse(recruiter, user);
    }

    public RecruiterResponse getByUserId(String userId) {
        Recruiter recruiter = recruiterRepository.findByUserIdAndDeletedFalse(userId).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return recruiterMapper.toRecruiterResponse(recruiter, user);
    }

    public PageResponse<RecruiterResponse> getAll(int page, int size) {
        int pageCurrent = page > 0 ? page - 1 : 0;
        int safeSize = size > 0 ? size : 10;
        Pageable pageable = PageRequest.of(pageCurrent, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Recruiter> recruiters = recruiterRepository.findAllByDeletedFalse(pageable);

        return PageResponse.<RecruiterResponse>builder()
                .items(recruiters.getContent().stream().map(recruiter -> {
                    User user = userRepository.findById(recruiter.getUserId()).orElse(null);
                    return recruiterMapper.toRecruiterResponse(recruiter, user);
                }).toList())
                .total(recruiters.getTotalElements())
                .page(pageCurrent + 1)
                .pageSize(safeSize)
                .totalPages(recruiters.getTotalPages())
                .build();
    }

    public RecruiterResponse update(String id, RecruiterRequest request, String currentUserId, boolean isAdmin) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        if (!isAdmin && !recruiter.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        User user = userRepository.findById(recruiter.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        String fixedUserId = recruiter.getUserId();
        recruiterMapper.updateRecruiter(recruiter, request);
        recruiter.setUserId(fixedUserId);

        if (isAdmin) {
            if (request.getStatus() != null) recruiter.setStatus(request.getStatus());
            if (request.getQuotaJobPost() != null) recruiter.setQuotaJobPost(request.getQuotaJobPost());
            if (request.getQuotaCvViews() != null) recruiter.setQuotaCvViews(request.getQuotaCvViews());
        }

        recruiter.setUpdatedAt(LocalDateTime.now());
        return recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
    }

    public RecruiterResponse updateStatus(String id, RecruiterStatusRequest request) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        User user = userRepository.findById(recruiter.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        recruiter.setStatus(request.getStatus());
        if (request.getQuotaJobPost() != null) recruiter.setQuotaJobPost(request.getQuotaJobPost());
        if (request.getQuotaCvViews() != null) recruiter.setQuotaCvViews(request.getQuotaCvViews());
        recruiter.setUpdatedAt(LocalDateTime.now());

        return recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
    }

    public RecruiterResponse getMe(String userId) {
        if (recruiterRepository.findByUserIdAndDeletedFalse(userId).isEmpty()) {
            createBasicProfile(userId);
        }
        return getByUserId(userId);
    }

    public RecruiterProfileResponse getProfile(String userId) {
        Recruiter r = recruiterRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        return RecruiterProfileResponse.builder()
                .recruiterId(r.getId())
                .userId(r.getUserId())
                .status(r.getStatus())
                .quotaJobPost(r.getQuotaJobPost())
                .quotaCvViews(r.getQuotaCvViews())
                .build();
    }

    public RecruiterProfileResponse addQuota(String userId, QuotaDeltaRequest request) {
        Recruiter r = recruiterRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        if (r.getQuotaJobPost() != -1) {
            r.setQuotaJobPost(r.getQuotaJobPost() + request.getAddJobPosts());
        }
        if (r.getQuotaCvViews() != -1) {
            r.setQuotaCvViews(r.getQuotaCvViews() + request.getAddCvViews());
        }
        r.setUpdatedAt(LocalDateTime.now());
        Recruiter saved = recruiterRepository.save(r);
        return RecruiterProfileResponse.builder()
                .recruiterId(saved.getId()).userId(saved.getUserId())
                .status(saved.getStatus()).quotaJobPost(saved.getQuotaJobPost()).quotaCvViews(saved.getQuotaCvViews())
                .build();
    }

    public void consumeJobQuota(String userId) {
        Recruiter r = recruiterRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        if (r.getQuotaJobPost() == 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_QUOTA);
        }
        if (r.getQuotaJobPost() != -1) {
            r.setQuotaJobPost(r.getQuotaJobPost() - 1);
            r.setUpdatedAt(LocalDateTime.now());
            recruiterRepository.save(r);
        }
    }

    public void refundJobQuota(String userId) {
        Recruiter r = recruiterRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        if (r.getQuotaJobPost() != -1) {
            r.setQuotaJobPost(r.getQuotaJobPost() + 1);
            r.setUpdatedAt(LocalDateTime.now());
            recruiterRepository.save(r);
        }
    }

    public void delete(String id) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        recruiter.setDeleted(true);
        recruiter.setDeletedAt(LocalDateTime.now());
        recruiter.setUpdatedAt(LocalDateTime.now());
        recruiterRepository.save(recruiter);
    }
}
