package vn.chuongpl.user_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.user_service.dtos.request.CandidateRequest;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.candidate.Candidate;
import vn.chuongpl.user_service.features.candidate.CandidateMapper;
import vn.chuongpl.user_service.features.candidate.CandidateRepository;
import vn.chuongpl.user_service.features.candidate.CandidateService;
import vn.chuongpl.user_service.features.user.User;
import vn.chuongpl.user_service.features.user.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CandidateServiceTest {

    @Mock
    CandidateRepository candidateRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    CandidateMapper candidateMapper;

    @InjectMocks
    CandidateService candidateService;

    @Test
    void create_shouldThrowWhenDuplicateUserId() {
        CandidateRequest request = CandidateRequest.builder().userId("u1").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(User.builder().id("u1").build()));
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(Candidate.builder().id("c1").userId("u1").build()));

        AppException ex = assertThrows(AppException.class, () -> candidateService.create(request));
        assertEquals(ErrorCode.CANDIDATE_EXISTED, ex.getErrorCode());
    }
}
