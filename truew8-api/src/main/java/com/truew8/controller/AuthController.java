package com.truew8.controller;

import com.truew8.dto.AuthRequestDTO;
import com.truew8.dto.AuthResponseDTO;
import com.truew8.service.AuthService;
import com.truew8.service.AuthSession;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final String SAME_SITE_LAX = "Lax";

    private final AuthService authService;
    private final String accessCookieName;
    private final String refreshCookieName;
    private final boolean secureCookies;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public AuthController(
            AuthService authService,
            @Value("${app.security.cookies.access-cookie-name:truew8_access}") String accessCookieName,
            @Value("${app.security.cookies.refresh-cookie-name:truew8_refresh}") String refreshCookieName,
            @Value("${app.security.cookies.secure:true}") boolean secureCookies,
            @Value("${app.jwt.access-expiration-ms:${app.jwt.expiration-ms:900000}}") long accessExpirationMs,
            @Value("${app.jwt.refresh-expiration-ms:1209600000}") long refreshExpirationMs
    ) {
        this.authService = authService;
        this.accessCookieName = accessCookieName;
        this.refreshCookieName = refreshCookieName;
        this.secureCookies = secureCookies;
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody AuthRequestDTO request) {
        AuthSession session = authService.register(request);
        return withSessionCookies(ResponseEntity.status(HttpStatus.CREATED), session)
                .body(new AuthResponseDTO(session.accessToken(), session.email()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody AuthRequestDTO request) {
        AuthSession session = authService.login(request);
        return withSessionCookies(ResponseEntity.ok(), session)
                .body(new AuthResponseDTO(session.accessToken(), session.email()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refresh(HttpServletRequest request) {
        String refreshToken = extractCookieValue(request, refreshCookieName);
        AuthSession session = authService.refresh(refreshToken);
        return withSessionCookies(ResponseEntity.ok(), session)
                .body(new AuthResponseDTO(session.accessToken(), session.email()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String refreshToken = extractCookieValue(request, refreshCookieName);
        authService.logoutByRefreshToken(refreshToken);

        return ResponseEntity.noContent()
                .header("Set-Cookie", clearCookie(accessCookieName, "/").toString())
                .header("Set-Cookie", clearCookie(refreshCookieName, "/auth/refresh").toString())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponseDTO> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(new AuthResponseDTO(null, authentication.getName()));
    }

    private ResponseEntity.BodyBuilder withSessionCookies(ResponseEntity.BodyBuilder response, AuthSession session) {
        return response
                .header("Set-Cookie", buildCookie(accessCookieName, session.accessToken(), "/", accessExpirationMs).toString())
                .header("Set-Cookie", buildCookie(refreshCookieName, session.refreshToken(), "/auth/refresh", refreshExpirationMs).toString());
    }

    private ResponseCookie buildCookie(String name, String value, String path, long expirationMs) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite(SAME_SITE_LAX)
                .path(path)
                .maxAge(Math.max(1, expirationMs / 1000))
                .build();
    }

    private ResponseCookie clearCookie(String name, String path) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite(SAME_SITE_LAX)
                .path(path)
                .maxAge(0)
                .build();
    }

    private String extractCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
