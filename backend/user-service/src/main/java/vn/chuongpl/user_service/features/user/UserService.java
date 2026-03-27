package vn.chuongpl.user_service.features.user;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.dtos.request.UserUpdateRequest;
import vn.chuongpl.user_service.dtos.response.UserResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;

    public User getById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
//
//    boolean existById(String id) {
//        return userRepository.existsById(id);
//    }

    public boolean verifyEmail(String email) {
        return !userRepository.existsByEmailAndDeletedFalse(email);
    }

    public Optional<User> findByEmailAndDeletedFalse(String email) {
        return userRepository.findByEmailAndDeletedFalse(email);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }


//    public Boolean verifyEmail(String emailRequest) {
//        Optional<User> user = userRepository.findByEmailAndDeletedFalse(emailRequest);
//        return !user.isPresent();
//    }
//
    public UserResponse updateUser(String email, UserUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        userMapper.toUpdate(user, request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public PageResponse<UserResponse> getAllUsers(Integer page) {
        int limit = 2 ;
        int pageCurrent = (page != null && page > 0) ? page - 1 : 0;
        Pageable pageable = PageRequest.of(pageCurrent, limit , Sort.by(Sort.Direction.DESC , "name"));
        List<String> roles = List.of(vn.chuongpl.user_service.enums.Role.USER.name(),
                                     vn.chuongpl.user_service.enums.Role.ADMIN.name());
        Page<User> users = userRepository.findByRolesIn(roles , pageable);

        return PageResponse.<UserResponse>builder()
        .items(users.getContent().stream().map(userMapper::toUserResponse).toList())
        .total(users.getTotalElements())
        .page(pageCurrent + 1)
        .pageSize(limit)

        .totalPages(users.getTotalPages())
        .build();
    }

    public void deleteUser(String id) {
        User user = userRepository.findByIdAndDeletedFalse(id)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setDeleted(!user.isDeleted());
        userRepository.save(user);
    }

//    public UserResponse addAdminRole(String id) {
//        User user = userRepository.findById(id)
//                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
//
//        HashSet<Role> roles = new HashSet<>(user.getRoles());
//
//        Role adminRole = roleRepository.findById("ADMIN")
//                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
//
//        roles.add(adminRole);
//        user.setRoles(roles);
//        return userMapper.toUserResponse(userRepository.save(user));
//    }
//
//    public SummaryResponse getUserSummary() {
//
//        long totalUsers = userRepository.count();
//
//        LocalDateTime now = LocalDateTime.now();
//
//        LocalDateTime startTimeCurrent = now.withDayOfMonth(1).toLocalDate().atStartOfDay();
//        LocalDateTime endTimeCurrent = now.toLocalDate().atTime(LocalTime.MAX); // 23:59:59.999...
//
//        LocalDateTime previousPeriod = now.minusMonths(1);
//        LocalDateTime startTimePrevious = previousPeriod.withDayOfMonth(1).toLocalDate().atStartOfDay();
//        LocalDateTime endTimePrevious = previousPeriod.toLocalDate().atTime(LocalTime.MAX);
//
//        long currentPeriodCount = userRepository.countByCreatedAtBetweenAndDeletedFalse(startTimeCurrent, endTimeCurrent);
//        long previousPeriodCount = userRepository.countByCreatedAtBetweenAndDeletedFalse(startTimePrevious, endTimePrevious);
//
//        double changePercentage = 0.0;
//        String direction = "neutral";
//
//        if (previousPeriodCount > 0) {
//            changePercentage = ((double) (currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100.0;
//        } else if (previousPeriodCount == 0 && currentPeriodCount > 0) {
//            changePercentage = 100.0;
//        }
//
//        if (changePercentage > 0) {
//            direction = "increase";
//        } else if (changePercentage < 0) {
//            direction = "decrease";
//        }
//
//        double roundedPercentage = Math.round(changePercentage * 100.0) / 100.0;
//
//        return SummaryResponse.builder()
//                .total(totalUsers)
//                .changeAmount(currentPeriodCount - previousPeriodCount)
//                .changePercentage(roundedPercentage)
//                .direction(direction)
//                .build();
//    }
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public UserResponse getUserById(String id) {
        if(id == null || id.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }
}
