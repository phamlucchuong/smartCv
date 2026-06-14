package vn.chuongpl.user_service.configuration.changelog;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import vn.chuongpl.user_service.features.candidate.Candidate;
import vn.chuongpl.user_service.features.role.Role;
import vn.chuongpl.user_service.features.user.User;

import java.time.LocalDateTime;
import java.util.Set;

@ChangeUnit(id = "V1_003__Init_mock_candidate_for_bypass_token", order = "003", author = "chuongpl")
public class V1_003__Init_mock_candidate_for_bypass_token {
    private static final String MOCK_USER_ID = "mock-candidate-user";
    private static final String MOCK_EMAIL = "mock-candidate@smartcv.local";

    @Execution
    public void initData(MongoTemplate mongoTemplate) {
        Role candidateRole = mongoTemplate.findById("CANDIDATE", Role.class);
        if (candidateRole == null) {
            candidateRole = Role.builder()
                    .name("CANDIDATE")
                    .description("Job seeker")
                    .permissions(Set.of())
                    .build();
            mongoTemplate.save(candidateRole);
        }

        Query userByIdQuery = Query.query(Criteria.where("_id").is(MOCK_USER_ID));
        if (!mongoTemplate.exists(userByIdQuery, User.class)) {
            User mockUser = User.builder()
                    .id(MOCK_USER_ID)
                    .fullName("Mock Candidate")
                    .email(MOCK_EMAIL)
                    .password("$2a$10$mGl6Qnn6RPj5sCcQojIFj.yvBtWF88/whqo57Hllz2XcbZUO1Rx5.")
                    .phone("0900000000")
                    .verified(true)
                    .locked(false)
                    .deleted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .roles(Set.of(candidateRole))
                    .build();
            mongoTemplate.save(mockUser);
        }

        Query candidateByUserQuery = Query.query(Criteria.where("user_id").is(MOCK_USER_ID).and("deleted").is(false));
        if (!mongoTemplate.exists(candidateByUserQuery, Candidate.class)) {
            Candidate candidate = Candidate.builder()
                    .userId(MOCK_USER_ID)
                    .bio("Mock candidate profile for bypass token testing")
                    .skills(java.util.List.of("Java", "Spring Boot"))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .deleted(false)
                    .build();
            mongoTemplate.save(candidate);
        }
    }

    @RollbackExecution
    public void rollback() {
    }
}
