package vn.chuongpl.user_service.features.wishlist;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends MongoRepository<Wishlist, String> {
    Optional<Wishlist> findByCandidateIdAndJobId(String candidateId, String jobId);
    Optional<Wishlist> findByCandidateIdAndJobIdAndDeletedFalse(String candidateId, String jobId);
    List<Wishlist> findAllByCandidateIdAndDeletedFalse(String candidateId);
    boolean existsByCandidateIdAndJobIdAndDeletedFalse(String candidateId, String jobId);
}
