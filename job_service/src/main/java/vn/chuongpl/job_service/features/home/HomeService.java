package vn.chuongpl.job_service.features.home;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.cache.annotation.Cacheable;
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

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class HomeService {

    MongoTemplate mongoTemplate;
    JobMapper jobMapper;

    private static final List<ResourceItem> STATIC_RESOURCES = List.of(
            new ResourceItem("1", "How to Write a Winning CV", "Practical tips to make your CV stand out to recruiters.", "/resources/cv-guide", "guide"),
            new ResourceItem("2", "Top 10 Interview Questions", "Prepare for the most common questions and nail your next interview.", "/resources/interview-prep", "article"),
            new ResourceItem("3", "Salary Negotiation Tips", "How to negotiate your offer confidently and professionally.", "/resources/salary-negotiation", "guide"),
            new ResourceItem("4", "Remote Work Best Practices", "Stay productive and visible when working from home.", "/resources/remote-work", "article")
    );

    private static final List<TestimonialItem> STATIC_TESTIMONIALS = List.of(
            new TestimonialItem("1", "Nguyen Van A", "Software Engineer", "TechCorp", "SmartCV helped me land my dream job in just 3 weeks. The AI matching is spot on!"),
            new TestimonialItem("2", "Tran Thi B", "Product Manager", "StartupXYZ", "I uploaded my CV and had interview invitations within days. Highly recommend!"),
            new TestimonialItem("3", "Le Van C", "Data Analyst", "FinanceGroup", "The job suggestions were surprisingly accurate for my background. Great platform.")
    );

    private static final List<FaqItem> STATIC_FAQS = List.of(
            new FaqItem("1", "Is SmartCV free to use for job seekers?", "Yes, creating an account and applying for jobs is completely free for candidates.", "general"),
            new FaqItem("2", "How does the AI job matching work?", "Our AI analyzes your CV skills and experience to rank jobs by relevance, so you see the best matches first.", "ai"),
            new FaqItem("3", "Can I upload multiple CVs?", "Yes, you can upload and manage multiple CV versions and choose which one to send per application.", "cv"),
            new FaqItem("4", "How do I withdraw a job application?", "Go to My Applications, find the application, and click Withdraw. This is available while the application is still Pending or Under Review.", "applications")
    );

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

    public List<ResourceItem> getResources() {
        return STATIC_RESOURCES;
    }

    public List<TestimonialItem> getTestimonials() {
        return STATIC_TESTIMONIALS;
    }

    public List<FaqItem> getFaqs() {
        return STATIC_FAQS;
    }
}
