package vn.chuongpl.job_service.features.home;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.features.job.Job;
import vn.chuongpl.job_service.features.job.JobMapper;
import vn.chuongpl.job_service.features.home.ResourceItem;
import vn.chuongpl.job_service.features.home.TestimonialItem;
import vn.chuongpl.job_service.features.home.FaqItem;
import vn.chuongpl.job_service.integration.applicationservice.ApplicationServiceClient;
import vn.chuongpl.job_service.integration.userservice.UserServiceClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HomeAggregatesServiceTest {
    @Mock MongoTemplate mongoTemplate;
    @Mock JobMapper jobMapper;
    @Mock UserServiceClient userServiceClient;
    @Mock ApplicationServiceClient applicationServiceClient;
    @InjectMocks HomeService homeService;

    @Test
    void getTopCompanies_shouldReturnAggregatedResultsWithCompanyId() {
        TopCompanyResponse company = new TopCompanyResponse();
        company.setRecruiterId("r1");
        company.setName("TechCorp");
        company.setLocation("Hanoi");
        company.setActiveJobCount(5);

        @SuppressWarnings("unchecked")
        AggregationResults<TopCompanyResponse> mockResults = mock(AggregationResults.class);
        when(mockResults.getMappedResults()).thenReturn(List.of(company));
        when(mongoTemplate.aggregate(any(Aggregation.class), eq("jobs"), eq(TopCompanyResponse.class)))
                .thenReturn(mockResults);
        when(userServiceClient.getCompanyId("r1")).thenReturn("company-uuid-1");

        List<TopCompanyResponse> result = homeService.getTopCompanies();

        assertEquals(1, result.size());
        assertEquals("TechCorp", result.get(0).getName());
        assertEquals("r1", result.get(0).getRecruiterId());
        assertEquals("company-uuid-1", result.get(0).getCompanyId());
        assertEquals(5L, result.get(0).getActiveJobCount());
    }

    @Test
    void getHotJobs_shouldReturnJobsSortedByApplicationCount() {
        Job job = new Job();
        job.setId("job1");
        JobResponse jobResponse = new JobResponse();
        jobResponse.setId("job1");

        when(applicationServiceClient.getTopJobIds(6)).thenReturn(List.of("job1"));
        when(mongoTemplate.find(any(Query.class), eq(Job.class))).thenReturn(List.of(job));
        when(jobMapper.toJobResponse(job)).thenReturn(jobResponse);

        List<JobResponse> result = homeService.getHotJobs();

        assertEquals(1, result.size());
        assertEquals("job1", result.get(0).getId());
    }

    @Test
    void getHotJobs_shouldFallbackToFeaturedJobsWhenNoApplications() {
        Job job = new Job();
        job.setId("featured1");
        JobResponse jobResponse = new JobResponse();
        jobResponse.setId("featured1");

        when(applicationServiceClient.getTopJobIds(6)).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(Job.class))).thenReturn(List.of(job));
        when(jobMapper.toJobResponse(job)).thenReturn(jobResponse);

        List<JobResponse> result = homeService.getHotJobs();

        assertEquals(1, result.size());
        assertEquals("featured1", result.get(0).getId());
    }

    @Test
    void getResources_shouldReturnNonEmptyList() {
        List<ResourceItem> result = homeService.getResources();
        assertFalse(result.isEmpty());
        assertNotNull(result.get(0).getTitle());
        assertNotNull(result.get(0).getUrl());
    }

    @Test
    void getTestimonials_shouldReturnNonEmptyList() {
        List<TestimonialItem> result = homeService.getTestimonials();
        assertFalse(result.isEmpty());
        assertNotNull(result.get(0).getName());
        assertNotNull(result.get(0).getQuote());
    }

    @Test
    void getFaqs_shouldReturnNonEmptyList() {
        List<FaqItem> result = homeService.getFaqs();
        assertFalse(result.isEmpty());
        assertNotNull(result.get(0).getQuestion());
        assertNotNull(result.get(0).getAnswer());
    }
}
