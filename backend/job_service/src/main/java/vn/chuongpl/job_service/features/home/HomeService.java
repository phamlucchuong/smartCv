package vn.chuongpl.job_service.features.home;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.enums.JobStatus;
import vn.chuongpl.job_service.enums.JobType;
import vn.chuongpl.job_service.features.job.Job;
import vn.chuongpl.job_service.features.job.JobMapper;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class HomeService {

    MongoTemplate mongoTemplate;
    JobMapper jobMapper;

    @Cacheable(value = "home:stats", unless = "#result == null")
    public HomeStatsResponse getStats() {
        Criteria active = Criteria.where("status").is(JobStatus.ACTIVE).and("deleted").is(false);

        long activeJobs = mongoTemplate.count(Query.query(active), Job.class);

        long activeCompanies = mongoTemplate.query(Job.class)
                .distinct("company")
                .matching(Query.query(active))
                .as(String.class)
                .all().size();

        long remoteJobs = mongoTemplate.count(
                Query.query(active.and("jobType").is(JobType.REMOTE)),
                Job.class);

        return HomeStatsResponse.builder()
                .activeJobs(activeJobs)
                .activeCompanies(activeCompanies)
                .remoteJobs(remoteJobs)
                .build();
    }

    @Cacheable(value = "home:categories", unless = "#result == null")
    public List<JobCategoryResponse> getCategories() {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("status").is(JobStatus.ACTIVE).and("deleted").is(false)),
                Aggregation.group("jobType").count().as("jobCount"),
                Aggregation.project("jobCount").and("_id").as("name"),
                Aggregation.sort(Sort.by(Sort.Direction.DESC, "jobCount"))
        );

        AggregationResults<JobCategoryResponse> results =
                mongoTemplate.aggregate(agg, "jobs", JobCategoryResponse.class);
        return results.getMappedResults();
    }

    @Cacheable(value = "home:featured-jobs", unless = "#result == null")
    public List<JobResponse> getFeaturedJobs() {
        Query q = Query.query(Criteria.where("status").is(JobStatus.ACTIVE).and("deleted").is(false))
                .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .limit(6);
        return mongoTemplate.find(q, Job.class).stream().map(jobMapper::toJobResponse).toList();
    }

    @Cacheable(value = "home:top-companies", unless = "#result == null")
    public List<TopCompanyResponse> getTopCompanies() {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("status").is(JobStatus.ACTIVE).and("deleted").is(false)),
                Aggregation.group("recruiterId")
                        .count().as("activeJobCount")
                        .first("company").as("name")
                        .first("location").as("location"),
                Aggregation.project("activeJobCount", "name", "location").and("_id").as("recruiterId"),
                Aggregation.sort(Sort.by(Sort.Direction.DESC, "activeJobCount")),
                Aggregation.limit(8)
        );
        AggregationResults<TopCompanyResponse> results =
                mongoTemplate.aggregate(agg, "jobs", TopCompanyResponse.class);
        return results.getMappedResults();
    }
}
