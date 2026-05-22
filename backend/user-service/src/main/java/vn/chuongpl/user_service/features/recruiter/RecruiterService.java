package vn.chuongpl.user_service.features.recruiter;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.dtos.request.RecruiterRequest;
import vn.chuongpl.user_service.dtos.response.RecruiterResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.user.User;
import vn.chuongpl.user_service.features.user.UserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class RecruiterService {
    RecruiterRepository recruiterRepository;
    UserRepository userRepository;
    RecruiterMapper recruiterMapper;

    public RecruiterResponse create(RecruiterRequest request) {
        User user = userRepository.findById(request.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (recruiterRepository.findByUserIdAndDeletedFalse(request.getUserId()).isPresent()) throw new AppException(ErrorCode.RECRUITER_EXISTED);

        Recruiter recruiter = recruiterMapper.toRecruiter(request);
        recruiter.setCreatedAt(LocalDateTime.now());
        recruiter.setUpdatedAt(LocalDateTime.now());
        recruiter.setDeleted(false);

        return recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
    }

    public void createBasicProfile(String userId) {
        if (recruiterRepository.findByUserIdAndDeletedFalse(userId).isPresent()) return;
        Recruiter recruiter = Recruiter.builder().userId(userId).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).deleted(false).build();
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
        recruiter.setUpdatedAt(LocalDateTime.now());
        return recruiterMapper.toRecruiterResponse(recruiterRepository.save(recruiter), user);
    }

    public void delete(String id) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.RECRUITER_NOT_FOUND));
        recruiter.setDeleted(true);
        recruiter.setDeletedAt(LocalDateTime.now());
        recruiter.setUpdatedAt(LocalDateTime.now());
        recruiterRepository.save(recruiter);
    }
}
