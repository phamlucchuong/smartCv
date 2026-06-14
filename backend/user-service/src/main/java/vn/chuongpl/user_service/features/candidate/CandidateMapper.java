package vn.chuongpl.user_service.features.candidate;

import org.mapstruct.*;
import vn.chuongpl.user_service.dtos.request.CandidateRequest;
import vn.chuongpl.user_service.dtos.response.CandidateResponse;
import vn.chuongpl.user_service.features.user.User;

@Mapper(componentModel = "spring")
public interface CandidateMapper {

    Candidate toCandidate(CandidateRequest request);

    @Mapping(target = "id",        source = "candidate.id")
    @Mapping(target = "userId",    source = "user.id")
    @Mapping(target = "fullName",  source = "user.fullName")
    @Mapping(target = "email",     source = "user.email")
    @Mapping(target = "phone",     source = "user.phone")
    @Mapping(target = "createdAt", source = "candidate.createdAt")
    @Mapping(target = "updatedAt", source = "candidate.updatedAt")
    CandidateResponse toCandidateResponse(Candidate candidate, User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "cvUrl",  ignore = true)
    void updateCandidate(@MappingTarget Candidate candidate, CandidateRequest request);
}
