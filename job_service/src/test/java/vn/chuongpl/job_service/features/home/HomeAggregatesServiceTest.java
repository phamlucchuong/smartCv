package vn.chuongpl.job_service.features.home;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import vn.chuongpl.job_service.features.job.JobMapper;
import vn.chuongpl.job_service.features.home.ResourceItem;
import vn.chuongpl.job_service.features.home.TestimonialItem;
import vn.chuongpl.job_service.features.home.FaqItem;

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
    @InjectMocks HomeService homeService;

    @Test
    void getTopCompanies_shouldReturnAggregatedResults() {
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

        List<TopCompanyResponse> result = homeService.getTopCompanies();

        assertEquals(1, result.size());
        assertEquals("TechCorp", result.get(0).getName());
        assertEquals("r1", result.get(0).getRecruiterId());
        assertEquals(5L, result.get(0).getActiveJobCount());
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
