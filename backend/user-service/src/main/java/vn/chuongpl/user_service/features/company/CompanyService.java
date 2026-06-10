package vn.chuongpl.user_service.features.company;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.enums.RecruiterStatus;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.recruiter.Recruiter;
import vn.chuongpl.user_service.features.recruiter.RecruiterRepository;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CompanyService {
    RecruiterRepository recruiterRepository;
    MongoTemplate mongoTemplate;

    public PageResponse<CompanyResponse> getAll(int page, int size, String query,
                                                 String industry, String companySize, String location) {
        int safeSize = size > 0 ? size : 10;
        int pageIdx = page > 0 ? page - 1 : 0;

        Criteria criteria = Criteria.where("deleted").is(false)
                .and("status").is(RecruiterStatus.APPROVED);
        if (query != null && !query.isBlank())       criteria.and("companyName").regex(query, "i");
        if (industry != null && !industry.isBlank()) criteria.and("industry").is(industry);
        if (companySize != null && !companySize.isBlank()) criteria.and("companySize").is(companySize);
        if (location != null && !location.isBlank()) criteria.and("companyAddress").regex(location, "i");

        Query mongoQuery = new Query(criteria)
                .with(PageRequest.of(pageIdx, safeSize, Sort.by("companyName")));
        List<Recruiter> recruiters = mongoTemplate.find(mongoQuery, Recruiter.class);
        long total = mongoTemplate.count(new Query(criteria), Recruiter.class);

        return PageResponse.<CompanyResponse>builder()
                .items(recruiters.stream().map(CompanyResponse::from).toList())
                .total(total)
                .page(pageIdx + 1)
                .pageSize(safeSize)
                .totalPages((int) Math.ceil((double) total / safeSize))
                .build();
    }

    public CompanyResponse getById(String id) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id)
                .filter(r -> r.getStatus() == RecruiterStatus.APPROVED)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));
        return CompanyResponse.from(recruiter);
    }

    public List<CompanyResponse> getByIds(List<String> ids) {
        return ids.stream()
                .map(id -> recruiterRepository.findByIdAndDeletedFalse(id)
                        .filter(r -> r.getStatus() == RecruiterStatus.APPROVED)
                        .map(CompanyResponse::from)
                        .orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }
}
