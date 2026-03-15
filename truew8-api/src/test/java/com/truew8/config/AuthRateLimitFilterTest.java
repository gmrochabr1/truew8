package com.truew8.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AuthRateLimitFilterTest {

    @Test
    void shouldReturnTooManyRequestsWhenAuthAttemptsExceedLimit() throws ServletException, IOException {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(true, 2, 60);

        MockHttpServletRequest firstRequest = new MockHttpServletRequest("POST", "/auth/login");
        firstRequest.setServletPath("/auth/login");
        firstRequest.setRemoteAddr("127.0.0.1");

        MockHttpServletRequest secondRequest = new MockHttpServletRequest("POST", "/auth/login");
        secondRequest.setServletPath("/auth/login");
        secondRequest.setRemoteAddr("127.0.0.1");

        MockHttpServletRequest thirdRequest = new MockHttpServletRequest("POST", "/auth/login");
        thirdRequest.setServletPath("/auth/login");
        thirdRequest.setRemoteAddr("127.0.0.1");

        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        MockHttpServletResponse thirdResponse = new MockHttpServletResponse();

        filter.doFilter(firstRequest, firstResponse, new MockFilterChain());
        filter.doFilter(secondRequest, secondResponse, new MockFilterChain());
        filter.doFilter(thirdRequest, thirdResponse, new MockFilterChain());

        assertEquals(200, firstResponse.getStatus());
        assertEquals(200, secondResponse.getStatus());
        assertEquals(429, thirdResponse.getStatus());
        assertTrue(thirdResponse.getContentType().startsWith("application/json"));
    }

    @Test
    void shouldNotApplyLimitOutsideProtectedAuthEndpoints() throws ServletException, IOException {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(true, 1, 60);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/rebalance");
        request.setServletPath("/rebalance");

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(200, response.getStatus());
    }
}
