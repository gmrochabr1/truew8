package com.truew8.service;

import com.truew8.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final int MIN_KEY_BYTES = 32;
    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_TOKEN_TYPE = "tokenType";
    private static final String CLAIM_REFRESH_TOKEN_ID = "refreshTokenId";
    private static final String TOKEN_TYPE_ACCESS = "access";
    private static final String TOKEN_TYPE_REFRESH = "refresh";

    private final String secret;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiration-ms:${app.jwt.expiration-ms:28800000}}") long accessExpirationMs,
            @Value("${app.jwt.refresh-expiration-ms:1209600000}") long refreshExpirationMs
    ) {
        this.secret = secret;
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateToken(User user) {
        return generateAccessToken(user);
    }

    public String generateAccessToken(User user) {
        return buildToken(
                Map.of(
                        CLAIM_USER_ID, user.getId().toString(),
                        CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS
                ),
                user.getEmail(),
                accessExpirationMs
        );
    }

    public String generateRefreshToken(User user, String refreshTokenId) {
        return buildToken(
                Map.of(
                        CLAIM_USER_ID, user.getId().toString(),
                        CLAIM_TOKEN_TYPE, TOKEN_TYPE_REFRESH,
                        CLAIM_REFRESH_TOKEN_ID, refreshTokenId
                ),
                user.getEmail(),
                refreshExpirationMs
        );
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public UUID extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        String userId = claims.get(CLAIM_USER_ID, String.class);
        return userId == null ? null : UUID.fromString(userId);
    }

    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_TOKEN_TYPE, String.class));
    }

    public String extractRefreshTokenId(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_REFRESH_TOKEN_ID, String.class));
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        return isAccessTokenValid(token, userDetails);
    }

    public boolean isAccessTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        String tokenType = extractTokenType(token);
        return TOKEN_TYPE_ACCESS.equals(tokenType)
                && username.equals(userDetails.getUsername())
                && !isTokenExpired(token);
    }

    public boolean isRefreshTokenValid(String token, User user) {
        String username = extractUsername(token);
        String tokenType = extractTokenType(token);
        return TOKEN_TYPE_REFRESH.equals(tokenType)
                && username.equals(user.getEmail())
                && !isTokenExpired(token)
                && extractRefreshTokenId(token) != null;
    }

    public boolean isTokenExpired(String token) {
        try {
            Date expiration = extractClaim(token, Claims::getExpiration);
            return expiration.before(Date.from(Instant.now()));
        } catch (ExpiredJwtException ignored) {
            return true;
        }
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expiryMs) {
        Instant now = Instant.now();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expiryMs)))
                .signWith(getSigningKey())
                .compact();
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = null;
        if (secret.matches("^[A-Za-z0-9+/=]+$") && secret.length() % 4 == 0) {
            try {
                byte[] decoded = Decoders.BASE64.decode(secret);
                if (decoded.length >= MIN_KEY_BYTES) {
                    keyBytes = decoded;
                }
            } catch (Exception ignored) {
                // Fall back to raw bytes when a plain string is provided.
            }
        }

        if (keyBytes == null) {
            byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
            if (raw.length >= MIN_KEY_BYTES) {
                keyBytes = raw;
            }
        }

        if (keyBytes == null) {
            throw new IllegalStateException(
                    "JWT secret must be at least 32 bytes (256 bits). Configure app.jwt.secret/JWT_SECRET with a strong value."
            );
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }
}
