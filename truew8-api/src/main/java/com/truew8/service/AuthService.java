package com.truew8.service;

import com.truew8.dto.AuthRequestDTO;
import com.truew8.entity.User;
import com.truew8.repository.UserRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenRotationService refreshTokenRotationService;
    private final long refreshExpirationMs;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenRotationService refreshTokenRotationService,
            @Value("${app.jwt.refresh-expiration-ms:1209600000}") long refreshExpirationMs
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenRotationService = refreshTokenRotationService;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public AuthSession register(AuthRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setOcrCount(2);

        User savedUser = userRepository.save(user);
        return issueSession(savedUser);
    }

    public AuthSession login(AuthRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.email());
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return issueSession(user);
    }

    public AuthSession refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing refresh token");
        }

        UUID userId;
        try {
            userId = jwtService.extractUserId(refreshToken);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!jwtService.isRefreshTokenValid(refreshToken, user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        String refreshTokenId = jwtService.extractRefreshTokenId(refreshToken);
        if (refreshTokenId == null || !refreshTokenRotationService.isCurrent(user.getId(), refreshTokenId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Expired refresh session");
        }

        return issueSession(user);
    }

    public void logoutByRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        try {
            UUID userId = jwtService.extractUserId(refreshToken);
            if (userId != null) {
                refreshTokenRotationService.revoke(userId);
            }
        } catch (Exception ignored) {
            // On logout, invalid token should not cause server failure.
        }
    }

    private AuthSession issueSession(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenId = refreshTokenRotationService.issueForUser(user.getId(), refreshExpirationMs);
        String refreshToken = jwtService.generateRefreshToken(user, refreshTokenId);
        return new AuthSession(accessToken, refreshToken, user.getEmail());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
