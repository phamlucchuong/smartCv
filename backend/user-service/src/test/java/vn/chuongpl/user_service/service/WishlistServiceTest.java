package vn.chuongpl.user_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.candidate.Candidate;
import vn.chuongpl.user_service.features.candidate.CandidateRepository;
import vn.chuongpl.user_service.features.wishlist.Wishlist;
import vn.chuongpl.user_service.features.wishlist.WishlistRepository;
import vn.chuongpl.user_service.features.wishlist.WishlistResponse;
import vn.chuongpl.user_service.features.wishlist.WishlistService;
import vn.chuongpl.user_service.integration.job.JobClient;
import vn.chuongpl.user_service.integration.job.JobSummary;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {
    @Mock WishlistRepository wishlistRepository;
    @Mock CandidateRepository candidateRepository;
    @Mock JobClient jobClient;
    @InjectMocks WishlistService wishlistService;

    final Candidate candidate = Candidate.builder().id("c1").userId("u1").build();

    @Test
    void getMyWishlists_shouldReturnListWithJobDetails() {
        Wishlist w = Wishlist.builder().id("w1").candidateId("c1").jobId("j1")
                .savedAt(LocalDateTime.now()).build();
        JobSummary job = new JobSummary();
        job.setId("j1"); job.setTitle("Engineer"); job.setCompany("ACME");
        job.setSkills(List.of("Java")); job.setStatus("ACTIVE");

        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.findAllByCandidateIdAndDeletedFalse("c1")).thenReturn(List.of(w));
        when(jobClient.getJobById("j1")).thenReturn(job);

        List<WishlistResponse> result = wishlistService.getMyWishlists("u1");

        assertEquals(1, result.size());
        assertEquals("Engineer", result.get(0).getTitle());
        assertEquals("j1", result.get(0).getJobId());
        assertEquals("ACTIVE", result.get(0).getJobStatus());
    }

    @Test
    void getMyWishlists_shouldThrowWhenCandidateNotFound() {
        when(candidateRepository.findByUserIdAndDeletedFalse("u99")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> wishlistService.getMyWishlists("u99"));
        assertEquals(ErrorCode.CANDIDATE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void save_shouldCreateNewEntryWhenNotExists() {
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.findByCandidateIdAndJobId("c1", "j1")).thenReturn(Optional.empty());

        wishlistService.save("u1", "j1");

        verify(wishlistRepository).save(argThat(w ->
                "c1".equals(w.getCandidateId()) && "j1".equals(w.getJobId()) && !w.isDeleted()));
    }

    @Test
    void save_shouldReactivateSoftDeletedEntry() {
        Wishlist deleted = Wishlist.builder().id("w1").candidateId("c1").jobId("j1").deleted(true).build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.findByCandidateIdAndJobId("c1", "j1")).thenReturn(Optional.of(deleted));

        wishlistService.save("u1", "j1");

        verify(wishlistRepository).save(argThat(w -> "w1".equals(w.getId()) && !w.isDeleted()));
    }

    @Test
    void remove_shouldSoftDelete() {
        Wishlist existing = Wishlist.builder().id("w1").candidateId("c1").jobId("j1").deleted(false).build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.findByCandidateIdAndJobIdAndDeletedFalse("c1", "j1"))
                .thenReturn(Optional.of(existing));

        wishlistService.remove("u1", "j1");

        verify(wishlistRepository).save(argThat(Wishlist::isDeleted));
    }

    @Test
    void contains_shouldReturnTrueWhenSaved() {
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.existsByCandidateIdAndJobIdAndDeletedFalse("c1", "j1")).thenReturn(true);

        assertTrue(wishlistService.contains("u1", "j1"));
    }
}
