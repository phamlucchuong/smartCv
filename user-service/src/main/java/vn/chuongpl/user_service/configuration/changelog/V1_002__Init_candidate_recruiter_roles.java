package vn.chuongpl.user_service.configuration.changelog;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import vn.chuongpl.user_service.features.role.Role;

import java.util.Set;

@ChangeUnit(id = "V1_002__Init_candidate_recruiter_roles", order = "002", author = "chuongpl")
public class V1_002__Init_candidate_recruiter_roles {
    @Execution
    public void initData(MongoTemplate mongoTemplate) {
        Role candidateRole = Role.builder()
                .name("CANDIDATE")
                .description("Job seeker")
                .permissions(Set.of())
                .build();
        Role recruiterRole = Role.builder()
                .name("RECRUITER")
                .description("Company recruiter")
                .permissions(Set.of())
                .build();

        if (!mongoTemplate.exists(org.springframework.data.mongodb.core.query.Query.query(org.springframework.data.mongodb.core.query.Criteria.where("_id").is("CANDIDATE")), Role.class)) {
            mongoTemplate.save(candidateRole);
        }
        if (!mongoTemplate.exists(org.springframework.data.mongodb.core.query.Query.query(org.springframework.data.mongodb.core.query.Criteria.where("_id").is("RECRUITER")), Role.class)) {
            mongoTemplate.save(recruiterRole);
        }
    }

    @RollbackExecution
    public void rollback() {
    }
}
