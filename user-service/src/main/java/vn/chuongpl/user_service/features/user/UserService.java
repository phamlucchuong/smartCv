package vn.chuongpl.user_service.features.user;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.dtos.request.ChangePasswordRequest;
import vn.chuongpl.user_service.dtos.request.UpdateRolesRequest;
import vn.chuongpl.user_service.dtos.request.UserStatusRequest;
import vn.chuongpl.user_service.dtos.request.UserUpdateRequest;
import vn.chuongpl.user_service.dtos.response.UserResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.role.Role;
import vn.chuongpl.user_service.features.role.RoleService;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    RoleService roleService;

    @NonFinal
    @Value("${app.user-default-page-size:10}")
    int defaultPageSize;

    public User getById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public boolean verifyEmail(String email) {
        return !userRepository.existsByEmailAndDeletedFalse(email);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> findAllByEmail(String email) {
        return userRepository.findAllByEmail(email);
    }

    public Optional<User> findByEmailAndDeletedFalse(String email) {
        return userRepository.findByEmailAndDeletedFalse(email);
    }

    public Optional<User> findByPhone(String phone) {
        return userRepository.findByPhone(phone);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public UserResponse updateUserById(String id, UserUpdateRequest request) {
        User user = userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        userMapper.toUpdate(user, request);
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        user.setUpdatedAt(LocalDateTime.now());
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findByIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.AUTHENTICATION_FAILED);
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public UserResponse updateUserRoles(String userId, UpdateRolesRequest request) {
        User user = userRepository.findByIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Set<Role> roles = new HashSet<>();
        for (String roleName : request.getRoles()) {
            Role role = roleService.findById(roleName.toUpperCase())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            roles.add(role);
        }
        user.setRoles(roles);
        user.setUpdatedAt(LocalDateTime.now());
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public PageResponse<UserResponse> getAllUsers(int page, int size) {
        int pageCurrent = page > 0 ? page - 1 : 0;
        int safeSize = size > 0 ? size : defaultPageSize;
        Pageable pageable = PageRequest.of(pageCurrent, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.findAll(pageable);

        return PageResponse.<UserResponse>builder()
                .items(users.getContent().stream().map(userMapper::toUserResponse).toList())
                .total(users.getTotalElements())
                .page(pageCurrent + 1)
                .pageSize(safeSize)
                .totalPages(users.getTotalPages())
                .build();
    }

    public void deleteUser(String id) {
        User user = userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setDeleted(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void hardDeleteUser(String id) {
        userRepository.deleteById(id);
    }

    public UserResponse updateUserStatus(String userId, UserStatusRequest request) {
        User user = userRepository.findByIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setLocked(request.isLocked());
        user.setUpdatedAt(LocalDateTime.now());
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmailAndDeletedFalse(email);
    }

    public UserResponse getUserById(String id) {
        if (id == null || id.isEmpty()) throw new AppException(ErrorCode.USER_NOT_FOUND);
        User user = userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }
}
