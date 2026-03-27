package vn.chuongpl.user_service.features.role;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RoleRepository extends MongoRepository<Role , String> {

//    @EntityGraph(attributePaths = {"permission"})
    Optional<Role> findByName(String name);
}
