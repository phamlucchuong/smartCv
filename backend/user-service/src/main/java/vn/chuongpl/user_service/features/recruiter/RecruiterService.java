package vn.chuongpl.user_service.features.recruiter;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.dtos.request.QuotaDeltaRequest;
import vn.chuongpl.user_service.dtos.request.RecruiterRequest;
import vn.chuongpl.user_service.dtos.request.RecruiterStatusRequest;
import vn.chuongpl.user_service.dtos.response.RecruiterProfileResponse;
import vn.chuongpl.user_service.dtos.response.RecruiterPublicResponse;
import vn.chuongpl.user_service.dtos.response.RecruiterResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.enums.RecruiterStatus;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.candidate.S3Service;
import vn.chuongpl.user_service.features.user.User;
import vn.chuongpl.user_service.features.user.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class RecruiterService {
    public static final int FREE_TIER_JOB_POST_QUOTA = 10;

    RecruiterRepository recruiterRepository;
    UserRepository userRepository;
    RecruiterMapper recruiterMapper;
    S3Service s3Service;
    MongoTemplate mongoTemplate;

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

        RecruiterResponse response = recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
        response.setBusinessLicenseUrl(getFreshLicenseUrl(response.getBusinessLicenseUrl()));
        return response;
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
                .status(RecruiterStatus.DRAFT)
                .quotaJobPost(FREE_TIER_JOB_POST_QUOTA)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .deleted(false)
                .build();
        recruiterRepository.save(recruiter);
    }

    public RecruiterPublicResponse getById(String id) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        User user = userRepository.findById(recruiter.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        RecruiterPublicResponse response = recruiterMapper.toRecruiterPublicResponse(recruiter, user);
        response.setBusinessLicenseUrl(getFreshLicenseUrl(response.getBusinessLicenseUrl()));
        return response;
    }

    public RecruiterPublicResponse getByUserId(String userId) {
        Recruiter recruiter = recruiterRepository.findByUserIdAndDeletedFalse(userId).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        RecruiterPublicResponse response = recruiterMapper.toRecruiterPublicResponse(recruiter, user);
        response.setBusinessLicenseUrl(getFreshLicenseUrl(response.getBusinessLicenseUrl()));
        return response;
    }

    public RecruiterResponse getByUserIdFull(String userId) {
        Recruiter recruiter = recruiterRepository.findByUserIdAndDeletedFalse(userId).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        RecruiterResponse response = recruiterMapper.toRecruiterResponse(recruiter, user);
        response.setBusinessLicenseUrl(getFreshLicenseUrl(response.getBusinessLicenseUrl()));
        return response;
    }

    public PageResponse<RecruiterResponse> getAll(int page, int size, RecruiterStatus status, String keyword) {
        int pageCurrent = page > 0 ? page - 1 : 0;
        int safeSize = size > 0 ? size : 10;
        Pageable pageable = PageRequest.of(pageCurrent, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        boolean hasKeyword = keyword != null && !keyword.isBlank();
        if (!hasKeyword) {
            Page<Recruiter> recruiters = status != null
                    ? recruiterRepository.findAllByStatusAndDeletedFalse(status, pageable)
                    : recruiterRepository.findAllByDeletedFalse(pageable);
            return PageResponse.<RecruiterResponse>builder()
                    .items(recruiters.getContent().stream().map(recruiter -> {
                        User user = userRepository.findById(recruiter.getUserId()).orElse(null);
                        RecruiterResponse res = recruiterMapper.toRecruiterResponse(recruiter, user);
                        res.setBusinessLicenseUrl(getFreshLicenseUrl(res.getBusinessLicenseUrl()));
                        return res;
                    }).toList())
                    .total(recruiters.getTotalElements())
                    .page(pageCurrent + 1)
                    .pageSize(safeSize)
                    .totalPages(recruiters.getTotalPages())
                    .build();
        }

        List<Criteria> parts = new ArrayList<>();
        parts.add(Criteria.where("deleted").is(false));
        if (status != null) {
            parts.add(Criteria.where("status").is(status));
        }
        parts.add(new Criteria().orOperator(
                Criteria.where("company_name").regex(keyword, "i"),
                Criteria.where("contact_name").regex(keyword, "i")
        ));
        Criteria criteria = new Criteria().andOperator(parts.toArray(new Criteria[0]));
        Query query = Query.query(criteria).with(pageable);
        Query countQuery = Query.query(criteria);
        List<Recruiter> items = mongoTemplate.find(query, Recruiter.class);
        long total = mongoTemplate.count(countQuery, Recruiter.class);
        int totalPages = safeSize > 0 ? (int) Math.ceil((double) total / safeSize) : 1;

        return PageResponse.<RecruiterResponse>builder()
                .items(items.stream().map(recruiter -> {
                    User user = userRepository.findById(recruiter.getUserId()).orElse(null);
                    RecruiterResponse res = recruiterMapper.toRecruiterResponse(recruiter, user);
                    res.setBusinessLicenseUrl(getFreshLicenseUrl(res.getBusinessLicenseUrl()));
                    return res;
                }).toList())
                .total(total)
                .page(pageCurrent + 1)
                .pageSize(safeSize)
                .totalPages(totalPages)
                .build();
    }

    public RecruiterResponse update(String id, RecruiterRequest request, String currentUserId, boolean isAdmin) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        if (!isAdmin && !recruiter.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (!isAdmin && recruiter.getStatus() == RecruiterStatus.PENDING) {
            throw new AppException(ErrorCode.RECRUITER_PROFILE_LOCKED);
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
        RecruiterResponse response = recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
        response.setBusinessLicenseUrl(getFreshLicenseUrl(response.getBusinessLicenseUrl()));
        return response;
    }

    public RecruiterResponse updateStatus(String id, RecruiterStatusRequest request) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        User user = userRepository.findById(recruiter.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        recruiter.setStatus(request.getStatus());
        if (request.getStatus() == RecruiterStatus.REJECTED) {
            recruiter.setRejectionNote(request.getRejectionNote());
        } else {
            recruiter.setRejectionNote(null);
        }
        if (request.getQuotaJobPost() != null) recruiter.setQuotaJobPost(request.getQuotaJobPost());
        if (request.getQuotaCvViews() != null) recruiter.setQuotaCvViews(request.getQuotaCvViews());
        recruiter.setUpdatedAt(LocalDateTime.now());

        RecruiterResponse response = recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
        response.setBusinessLicenseUrl(getFreshLicenseUrl(response.getBusinessLicenseUrl()));
        return response;
    }

    public RecruiterResponse submitForApproval(String userId) {
        Recruiter recruiter = recruiterRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));

        if (recruiter.getStatus() != RecruiterStatus.DRAFT && recruiter.getStatus() != RecruiterStatus.REJECTED) {
            throw new AppException(ErrorCode.RECRUITER_INVALID_STATUS_TRANSITION);
        }

        validateProfileComplete(recruiter);

        recruiter.setStatus(RecruiterStatus.PENDING);
        recruiter.setRejectionNote(null);
        recruiter.setUpdatedAt(LocalDateTime.now());

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        RecruiterResponse response = recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
        response.setBusinessLicenseUrl(getFreshLicenseUrl(response.getBusinessLicenseUrl()));
        return response;
    }

    public RecruiterResponse uploadBusinessLicense(String userId, MultipartFile file) {
        Recruiter recruiter = recruiterRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));

        String url = s3Service.uploadBusinessLicense(file, userId);
        recruiter.setBusinessLicenseUrl(url);
        recruiter.setUpdatedAt(LocalDateTime.now());

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        RecruiterResponse response = recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
        response.setBusinessLicenseUrl(getFreshLicenseUrl(response.getBusinessLicenseUrl()));
        return response;
    }

    public RecruiterResponse getMe(String userId) {
        if (recruiterRepository.findByUserIdAndDeletedFalse(userId).isEmpty()) {
            createBasicProfile(userId);
        }
        return getByUserIdFull(userId);
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

    private void validateProfileComplete(Recruiter r) {
        if (isBlank(r.getCompanyName()) || isBlank(r.getTaxCode()) ||
                isBlank(r.getCompanyAddress()) || isBlank(r.getCompanyCity()) ||
                isBlank(r.getIndustry()) || isBlank(r.getCompanyType()) ||
                isBlank(r.getCompanySize()) || isBlank(r.getBusinessLicenseUrl())) {
            throw new AppException(ErrorCode.RECRUITER_PROFILE_INCOMPLETE);
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String getFreshLicenseUrl(String storedUrl) {
        if (storedUrl == null || storedUrl.isBlank()) {
            return storedUrl;
        }
        int idx = storedUrl.indexOf("recruiters/");
        if (idx == -1) {
            return storedUrl;
        }
        String key = storedUrl.substring(idx);
        if (key.contains("?")) {
            key = key.substring(0, key.indexOf("?"));
        }
        try {
            return s3Service.generatePresignedUrl(key);
        } catch (Exception e) {
            return storedUrl;
        }
    }
}
