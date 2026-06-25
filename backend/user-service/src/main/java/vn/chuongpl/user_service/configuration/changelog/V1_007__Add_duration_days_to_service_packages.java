package vn.chuongpl.user_service.configuration.changelog;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

@ChangeUnit(id = "V1_007__Add_duration_days_to_service_packages", order = "007", author = "codex")
public class V1_007__Add_duration_days_to_service_packages {

    @Execution
    public void execute(MongoTemplate mongoTemplate) {
        // no-op: durationDays defaults to null on existing documents (no expiry)
    }

    @RollbackExecution
    public void rollback(MongoTemplate mongoTemplate) {
        // no-op
    }
}
