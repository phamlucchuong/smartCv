package vn.chuongpl.user_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.user_service.features.recruiter.Recruiter;
import vn.chuongpl.user_service.features.recruiter.RecruiterMapper;
import vn.chuongpl.user_service.features.recruiter.RecruiterRepository;
import vn.chuongpl.user_service.features.recruiter.RecruiterService;
import vn.chuongpl.user_service.features.user.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecruiterServiceTest {

    @Mock
    RecruiterRepository recruiterRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    RecruiterMapper recruiterMapper;

    @InjectMocks
    RecruiterService recruiterService;

    @Test
    void createBasicProfile_shouldPersistCompanyNameWhenProvided() {
        when(recruiterRepository.findByUserIdAndDeletedFalse("u2")).thenReturn(Optional.empty());

        recruiterService.createBasicProfile("u2", "ACME");

        ArgumentCaptor<Recruiter> recruiterCaptor = ArgumentCaptor.forClass(Recruiter.class);
        verify(recruiterRepository).save(recruiterCaptor.capture());

        Recruiter recruiter = recruiterCaptor.getValue();
        assertEquals("u2", recruiter.getUserId());
        assertEquals("ACME", recruiter.getCompanyName());
        assertFalse(recruiter.isDeleted());
        assertNotNull(recruiter.getCreatedAt());
        assertNotNull(recruiter.getUpdatedAt());
    }

    @Test
    void createBasicProfile_shouldUpdateExistingCompanyNameWhenProvided() {
        Recruiter existingRecruiter = Recruiter.builder()
                .id("r1")
                .userId("u2")
                .companyName("Old Corp")
                .build();
        when(recruiterRepository.findByUserIdAndDeletedFalse("u2")).thenReturn(Optional.of(existingRecruiter));

        recruiterService.createBasicProfile("u2", "New Corp");

        assertEquals("New Corp", existingRecruiter.getCompanyName());
        assertNotNull(existingRecruiter.getUpdatedAt());
        verify(recruiterRepository).save(existingRecruiter);
    }
}
