package vn.chuongpl.user_service.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class S3Config {

    @Value("${AWS_REGION:ap-southeast-1}")
    String region;

    @Value("${AWS_ACCESS_KEY_ID:}")
    String accessKey;

    @Value("${AWS_SECRET_ACCESS_KEY:}")
    String secretKey;

    @Bean
    public S3Client s3Client() {
        AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);
        return S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .build();
    }
}
