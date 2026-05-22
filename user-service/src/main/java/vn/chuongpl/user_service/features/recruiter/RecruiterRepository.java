package vn.chuongpl.user_service.features.recruiter;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecruiterRepository extends MongoRepository<Recruiter, String> {
    Optional<Recruiter> findByUserIdAndDeletedFalse(String userId);

    Optional<Recruiter> findByIdAndDeletedFalse(String id);

    Page<Recruiter> findAllByDeletedFalse(Pageable pageable);
}
