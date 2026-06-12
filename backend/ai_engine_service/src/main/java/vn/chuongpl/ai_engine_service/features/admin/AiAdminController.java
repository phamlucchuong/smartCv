package vn.chuongpl.ai_engine_service.features.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.ai_engine_service.dtos.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/ai/admin/providers")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AiAdminController {

    private final AiAdminService adminService;

    @GetMapping
    public ApiResponse<List<AiProviderConfigResponse>> listProviders() {
        return ApiResponse.<List<AiProviderConfigResponse>>builder()
                .data(adminService.listAll())
                .build();
    }

    @PutMapping("/{provider}")
    public ApiResponse<AiProviderConfigResponse> upsertProvider(
            @PathVariable String provider,
            @RequestBody AiProviderConfigRequest request) {
        return ApiResponse.<AiProviderConfigResponse>builder()
                .data(adminService.upsert(provider, request))
                .build();
    }

    @DeleteMapping("/{provider}")
    public ApiResponse<Void> deleteProvider(@PathVariable String provider) {
        adminService.delete(provider);
        return ApiResponse.<Void>builder().message("Provider deleted").build();
    }

    @PutMapping("/{provider}/activate")
    public ApiResponse<AiProviderConfigResponse> activateProvider(@PathVariable String provider) {
        return ApiResponse.<AiProviderConfigResponse>builder()
                .data(adminService.activate(provider))
                .build();
    }

    @GetMapping("/active")
    public ApiResponse<AiProviderConfigResponse> getActiveProvider() {
        return ApiResponse.<AiProviderConfigResponse>builder()
                .data(adminService.getActive())
                .build();
    }
}
