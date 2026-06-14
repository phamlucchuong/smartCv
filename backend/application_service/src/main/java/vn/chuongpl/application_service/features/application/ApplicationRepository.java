package vn.chuongpl.application_service.features.application;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import vn.chuongpl.application_service.enums.ApplicationStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends MongoRepository<Application, String> {
    boolean existsByCandidateIdAndJobIdAndStatusIn(String candidateId, String jobId, List<ApplicationStatus> statuses);

    Page<Application> findByCandidateIdAndDeletedFalse(String candidateId, Pageable pageable);

    Page<Application> findByJobIdAndDeletedFalse(String jobId, Pageable pageable);

    Page<Application> findByRecruiterIdAndDeletedFalse(String recruiterId, Pageable pageable);

    Page<Application> findAllByDeletedFalse(Pageable pageable);

    Optional<Application> findByIdAndDeletedFalse(String id);

    Optional<Application> findByCandidateIdAndJobIdAndDeletedFalse(String candidateId, String jobId);
}
