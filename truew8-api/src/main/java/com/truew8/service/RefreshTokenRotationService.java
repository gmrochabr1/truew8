package com.truew8.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class RefreshTokenRotationService {

    private final ConcurrentHashMap<UUID, TokenVersion> tokenVersionsByUserId = new ConcurrentHashMap<>();

    public String issueForUser(UUID userId, long ttlMs) {
        String refreshTokenId = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusMillis(ttlMs);
        tokenVersionsByUserId.put(userId, new TokenVersion(refreshTokenId, expiresAt));
        cleanupExpired();
        return refreshTokenId;
    }

    public boolean isCurrent(UUID userId, String refreshTokenId) {
        TokenVersion current = tokenVersionsByUserId.get(userId);
        if (current == null) {
            return false;
        }
        if (current.expiresAt().isBefore(Instant.now())) {
            tokenVersionsByUserId.remove(userId, current);
            return false;
        }
        return current.refreshTokenId().equals(refreshTokenId);
    }

    public void revoke(UUID userId) {
        tokenVersionsByUserId.remove(userId);
    }

    private void cleanupExpired() {
        Instant now = Instant.now();
        for (Map.Entry<UUID, TokenVersion> entry : tokenVersionsByUserId.entrySet()) {
            TokenVersion value = entry.getValue();
            if (value.expiresAt().isBefore(now)) {
                tokenVersionsByUserId.remove(entry.getKey(), value);
            }
        }
    }

    private record TokenVersion(String refreshTokenId, Instant expiresAt) {
    }
}
