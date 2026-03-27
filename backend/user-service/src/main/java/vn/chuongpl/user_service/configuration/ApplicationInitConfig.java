//package com.example.bigfood.configuration;
//
//import java.time.LocalDateTime;
//import java.util.HashSet;
//
//import org.springframework.boot.ApplicationRunner;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.transaction.annotation.Transactional;
//
//import lombok.AccessLevel;
//import lombok.RequiredArgsConstructor;
//import lombok.experimental.FieldDefaults;
//import lombok.experimental.NonFinal;
//import lombok.extern.slf4j.Slf4j;
//
//@Configuration
//@RequiredArgsConstructor
//@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
//@Slf4j
//public class ApplicationInitConfig {
//
//    PasswordEncoder passwordEncoder;
//
//    @NonFinal
//    static final String ADMIN_EMAIL = "admin@gmail.com";
//    @NonFinal
//    static final String ADMIN_PASSWORD = "123456";
//
//    @Bean
//    @Transactional
//    ApplicationRunner applicationRunner(UserRepository userRepository, RoleRepository roleRepository) {
//        return args -> {
//            if (userRepository.findByEmail(ADMIN_EMAIL).isEmpty()) {
//                var roles = new HashSet<Role>();
//                Role role = roleRepository.findById("ADMIN").orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
//                roles.add(role);
//
//                User user = User.builder()
//                        .name("admin")
//                        .email(ADMIN_EMAIL)
//                        .password(passwordEncoder.encode(ADMIN_PASSWORD))
//                        .phone("0377948504")
//                        .roles(roles)
//                        .createdAt(LocalDateTime.now())
//                        .build();
//
//                if(user != null) userRepository.save(user);
//            }
//        };
//    }
//
//}
