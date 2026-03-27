package vn.chuongpl.user_service;

import io.github.cdimascio.dotenv.Dotenv;
import io.mongock.runner.springboot.EnableMongock;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableMongock
@SpringBootApplication
public class UserServiceApplication {

	public static void main(String[] args) {

//		// 1. Cấu hình dotenv để đọc file .env
//		Dotenv dotenv = Dotenv.configure()
//				.directory("../") // Tìm file .env ở thư mục gốc
//				.ignoreIfMissing() // Không báo lỗi nếu không tìm thấy (dùng khi deploy thật)
//				.load();
//
//		// 2. Đẩy từng biến trong .env vào System Properties của Java
//		dotenv.entries().forEach(entry -> {
//			System.setProperty(entry.getKey(), entry.getValue());
//		});

		SpringApplication.run(UserServiceApplication.class, args);
	}

}
