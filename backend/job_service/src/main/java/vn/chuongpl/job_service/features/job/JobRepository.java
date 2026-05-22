package vn.chuongpl.job_service.features.job;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import vn.chuongpl.job_service.enums.JobStatus;

import java.util.Optional;

@Repository
public interface JobRepository extends MongoRepository<Job, String> {
    Optional<Job> findByIdAndDeletedFalse(String id);

    Page<Job> findByDeletedFalse(Pageable pageable);

    Page<Job> findByRecruiterIdAndDeletedFalse(String recruiterId, Pageable pageable);

    Page<Job> findByStatusAndDeletedFalse(JobStatus status, Pageable pageable);

    boolean existsByIdAndRecruiterId(String id, String recruiterId);
}
