package vn.chuongpl.api_gateway.configuration;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Date;

@Component
public class GatewayJwtUtils {

    @Value("${app.jwt.secret-key}")
    private String signerKey;
    @Value("${app.jwt.bypass-token:}")
    private String bypassToken;
    @Value("${app.jwt.bypass-user-id:test-user}")
    private String bypassUserId;
    @Value("${app.jwt.bypass-scope:ROLE_ADMIN}")
    private String bypassScope;

    public JWTClaimsSet verify(String token) throws Exception {
        if (bypassToken != null && !bypassToken.isBlank() && bypassToken.equals(token)) {
            return new JWTClaimsSet.Builder()
                    .subject(bypassUserId)
                    .claim("scope", bypassScope)
                    .claim("bypass", true)
                    .audience(Collections.singletonList("smartcv-gateway"))
                    .expirationTime(new Date(System.currentTimeMillis() + 86_400_000L))
                    .build();
        }

        SignedJWT jwt = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(signerKey.getBytes());
        if (!jwt.verify(verifier)) {
            throw new IllegalArgumentException("Invalid signature");
        }
        Date expiry = jwt.getJWTClaimsSet().getExpirationTime();
        if (expiry == null || expiry.before(new Date())) {
            throw new IllegalArgumentException("Token expired");
        }
        return jwt.getJWTClaimsSet();
    }

    public String extractUserId(JWTClaimsSet claims) {
        return claims.getSubject();
    }

    public String extractScope(JWTClaimsSet claims) {
        Object scope = claims.getClaim("scope");
        return scope == null ? "" : String.valueOf(scope);
    }
}
