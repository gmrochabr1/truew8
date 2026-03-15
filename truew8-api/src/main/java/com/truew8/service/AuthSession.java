package com.truew8.service;

public record AuthSession(
        String accessToken,
        String refreshToken,
        String email
) {
}
