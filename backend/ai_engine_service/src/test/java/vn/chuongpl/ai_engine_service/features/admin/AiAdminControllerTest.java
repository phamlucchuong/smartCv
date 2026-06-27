package vn.chuongpl.ai_engine_service.features.admin;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import vn.chuongpl.ai_engine_service.config.SecurityConfig;
import vn.chuongpl.ai_engine_service.model.AiProvider;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AiAdminController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(SecurityConfig.class)
class AiAdminControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean AiAdminService adminService;

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void listProviders_admin_returns_200() throws Exception {
        when(adminService.listAll()).thenReturn(List.of());

        mvc.perform(get("/api/ai/admin/providers"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_CANDIDATE")
    void listProviders_non_admin_returns_403() throws Exception {
        mvc.perform(get("/api/ai/admin/providers"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void activateProvider_admin_calls_service_and_returns_200() throws Exception {
        var response = AiProviderConfigResponse.builder()
                .provider(AiProvider.GEMINI).active(true).configured(true).build();
        when(adminService.activate("gemini")).thenReturn(response);

        mvc.perform(put("/api/ai/admin/providers/gemini/activate"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.provider").value("GEMINI"))
            .andExpect(jsonPath("$.data.active").value(true));

        verify(adminService).activate("gemini");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deleteProvider_admin_returns_200() throws Exception {
        doNothing().when(adminService).delete("groq");

        mvc.perform(delete("/api/ai/admin/providers/groq"))
            .andExpect(status().isOk());

        verify(adminService).delete("groq");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getActiveProvider_returns_active_response() throws Exception {
        var response = AiProviderConfigResponse.builder()
                .provider(AiProvider.GEMINI).active(true).configured(true).build();
        when(adminService.getActive()).thenReturn(response);

        mvc.perform(get("/api/ai/admin/providers/active"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.active").value(true));
    }
}
