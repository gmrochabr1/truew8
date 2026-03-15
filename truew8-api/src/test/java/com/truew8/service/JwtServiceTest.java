package com.truew8.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.truew8.entity.User;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;

class JwtServiceTest {

    private static final String SECRET = "12345678901234567890123456789012";

    @Test
    void shouldGenerateAndValidateToken() {
        JwtService jwtService = new JwtService(SECRET, 60_000L, 120_000L);

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@truew8.com");

        String token = jwtService.generateToken(user);

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password("ignored")
                .roles("USER")
                .build();

        assertEquals("user@truew8.com", jwtService.extractUsername(token));
        assertEquals(user.getId(), jwtService.extractUserId(token));
        assertTrue(jwtService.isAccessTokenValid(token, userDetails));
        assertFalse(jwtService.isTokenExpired(token));
    }

    @Test
    void shouldExpireToken() throws InterruptedException {
        JwtService jwtService = new JwtService(SECRET, 30L, 120_000L);

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("expired@truew8.com");

        String token = jwtService.generateToken(user);

        Thread.sleep(60L);

        assertTrue(jwtService.isTokenExpired(token));
    }

    @Test
    void shouldFailFastForWeakSecret() {
        JwtService jwtService = new JwtService("weak-secret", 60_000L, 120_000L);

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("weak@truew8.com");

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> jwtService.generateToken(user));
        assertTrue(exception.getMessage().contains("at least 32 bytes"));
    }
}
