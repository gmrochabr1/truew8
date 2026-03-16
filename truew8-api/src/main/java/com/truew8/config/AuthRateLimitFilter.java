package com.truew8.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.truew8.service.MessageResolver;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_TRACKED_KEYS_BEFORE_CLEANUP = 10_000;
    private static final String FORWARDED_FOR_HEADER = "X-Forwarded-For";

    private final boolean enabled;
    private final int maxAttempts;
    private final int windowSeconds;
    private final MessageResolver messages;
    private final ConcurrentHashMap<String, SlidingWindowCounter> counters = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(
            MessageResolver messages,
            @Value("${app.security.auth-rate-limit.enabled:true}") boolean enabled,
            @Value("${app.security.auth-rate-limit.max-attempts:15}") int maxAttempts,
            @Value("${app.security.auth-rate-limit.window-seconds:60}") int windowSeconds
    ) {
        this.messages = messages;
        this.enabled = enabled;
        this.maxAttempts = Math.max(1, maxAttempts);
        this.windowSeconds = Math.max(1, windowSeconds);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        if (!enabled || !isProtectedAuthEndpoint(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = Instant.now().getEpochSecond();
        String key = buildCounterKey(request);

        SlidingWindowCounter counter = counters.compute(key, (counterKey, current) -> {
            if (current == null || now - current.windowStartEpochSecond() >= windowSeconds) {
                return new SlidingWindowCounter(now);
            }
            return current;
        });

        if (counter == null) {
            filterChain.doFilter(request, response);
            return;
        }

        int attempts = counter.attempts().incrementAndGet();
        if (attempts > maxAttempts) {
            long elapsed = now - counter.windowStartEpochSecond();
            long retryAfterSeconds = Math.max(1, windowSeconds - elapsed);
            respondRateLimited(response, retryAfterSeconds, request.getLocale());
            return;
        }

        if (counters.size() > MAX_TRACKED_KEYS_BEFORE_CLEANUP) {
            cleanupExpiredCounters(now);
        }

        filterChain.doFilter(request, response);
    }

    private boolean isProtectedAuthEndpoint(HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return false;
        }
        String path = request.getServletPath();
        return "/auth/login".equals(path) || "/auth/register".equals(path);
    }

    private String buildCounterKey(HttpServletRequest request) {
        String xForwardedFor = request.getHeader(FORWARDED_FOR_HEADER);
        String clientIp = request.getRemoteAddr();
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String[] values = xForwardedFor.split(",");
            clientIp = values[0].trim();
        }
        return clientIp + ':' + request.getServletPath();
    }

    private void cleanupExpiredCounters(long now) {
        for (Map.Entry<String, SlidingWindowCounter> entry : counters.entrySet()) {
            SlidingWindowCounter value = entry.getValue();
            if (now - value.windowStartEpochSecond() >= windowSeconds) {
                counters.remove(entry.getKey(), value);
            }
        }
    }

    private void respondRateLimited(HttpServletResponse response, long retryAfterSeconds, Locale locale) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        String message = messages.getForLocale(locale, "rate.limit.auth.attempts");
        response.getWriter().write("{\"errorCode\":\"RATE_LIMITED\",\"message\":\"" + message + "\"}");
    }

    private record SlidingWindowCounter(long windowStartEpochSecond, AtomicInteger attempts) {
        private SlidingWindowCounter(long windowStartEpochSecond) {
            this(windowStartEpochSecond, new AtomicInteger(0));
        }
    }
}
