package com.truew8.exception;

import java.time.Instant;

public record ApiErrorResponse(
        int status,
        String error,
        String message,
        String path,
        Instant timestamp
) {
}
