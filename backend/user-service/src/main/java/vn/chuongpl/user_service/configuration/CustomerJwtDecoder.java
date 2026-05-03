package vn.chuongpl.user_service.configuration;

import java.text.ParseException;
import java.util.Objects;
import javax.crypto.spec.SecretKeySpec;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import vn.chuongpl.user_service.dtos.request.IntrospectRequest;
import vn.chuongpl.user_service.features.auth.AuthService;
import com.nimbusds.jose.JOSEException;


@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomerJwtDecoder implements JwtDecoder {

    @NonFinal
    @Value("${JWT_SECRET_KEY}")
    String SIGNER_KEY;
    AuthService authService;

    @NonFinal
    NimbusJwtDecoder nimbusJwtDecoder;

    @Override
    public Jwt decode(String token){
        try {
            var response = authService.introspect(
                IntrospectRequest.builder().token(token).build()
                );
            if(!response.isAuthenticated()) {
              throw new JwtException("Token invalid");
            }
        } catch (JOSEException | ParseException e) {
           throw new JwtException(e.getMessage());
        }

        if(Objects.isNull(nimbusJwtDecoder)){
            SecretKeySpec secretKey = new SecretKeySpec(SIGNER_KEY.getBytes() , "HS512");
            nimbusJwtDecoder = NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
        }
        return nimbusJwtDecoder.decode(token);
    }
}
