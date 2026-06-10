package vn.chuongpl.user_service.features.company;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.user_service.dtos.ApiResponse;
import vn.chuongpl.user_service.dtos.PageResponse;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CompanyController {
    CompanyService companyService;

    @GetMapping
    public ApiResponse<PageResponse<CompanyResponse>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String companySize,
            @RequestParam(required = false) String location) {
        return ApiResponse.<PageResponse<CompanyResponse>>builder()
                .data(companyService.getAll(page, size, query, industry, companySize, location))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CompanyResponse> getById(@PathVariable String id) {
        return ApiResponse.<CompanyResponse>builder()
                .data(companyService.getById(id))
                .build();
    }
}
