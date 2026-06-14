package vn.chuongpl.user_service.features.wishlist;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.candidate.Candidate;
import vn.chuongpl.user_service.features.candidate.CandidateRepository;
import vn.chuongpl.user_service.integration.job.JobClient;
import vn.chuongpl.user_service.integration.job.JobSummary;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WishlistService {
    WishlistRepository wishlistRepository;
    CandidateRepository candidateRepository;
    JobClient jobClient;

    public List<WishlistResponse> getMyWishlists(String userId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        return wishlistRepository.findAllByCandidateIdAndDeletedFalse(candidate.getId())
                .stream()
                .map(w -> buildResponse(w, jobClient.getJobById(w.getJobId())))
                .toList();
    }

    public void save(String userId, String jobId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        Wishlist wishlist = wishlistRepository
                .findByCandidateIdAndJobId(candidate.getId(), jobId)
                .orElse(Wishlist.builder().candidateId(candidate.getId()).jobId(jobId).build());
        wishlist.setDeleted(false);
        wishlist.setSavedAt(LocalDateTime.now());
        wishlistRepository.save(wishlist);
    }

    public void remove(String userId, String jobId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        wishlistRepository.findByCandidateIdAndJobIdAndDeletedFalse(candidate.getId(), jobId)
                .ifPresent(w -> { w.setDeleted(true); wishlistRepository.save(w); });
    }

    public boolean contains(String userId, String jobId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        return wishlistRepository.existsByCandidateIdAndJobIdAndDeletedFalse(candidate.getId(), jobId);
    }

    private WishlistResponse buildResponse(Wishlist w, JobSummary job) {
        WishlistResponse.WishlistResponseBuilder b = WishlistResponse.builder()
                .jobId(w.getJobId())
                .savedAt(w.getSavedAt());
        if (job != null) {
            b.title(job.getTitle()).company(job.getCompany()).location(job.getLocation())
             .salaryMin(job.getSalaryMin()).salaryMax(job.getSalaryMax())
             .skills(job.getSkills()).jobType(job.getJobType()).jobStatus(job.getStatus());
        }
        return b.build();
    }
}
