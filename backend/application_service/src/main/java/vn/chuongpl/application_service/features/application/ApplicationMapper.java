package vn.chuongpl.application_service.features.application;

import org.mapstruct.*;
import vn.chuongpl.application_service.dtos.request.ApplicationStatusUpdateRequest;
import vn.chuongpl.application_service.dtos.response.ApplicationDetailResponse;
import vn.chuongpl.application_service.dtos.response.ApplicationResponse;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {
    ApplicationResponse toResponse(Application application);

    ApplicationDetailResponse toDetailResponse(Application application);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateStatus(@MappingTarget Application application, ApplicationStatusUpdateRequest request);
}
