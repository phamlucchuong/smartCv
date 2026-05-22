package vn.chuongpl.job_service.features.job;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface JobElasticsearchRepository extends ElasticsearchRepository<JobDocument, String> {
    Page<JobDocument> findByStatus(String status, Pageable pageable);
}
