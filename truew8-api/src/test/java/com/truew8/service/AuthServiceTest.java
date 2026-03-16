package com.truew8.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.truew8.dto.AuthRequestDTO;
import com.truew8.entity.User;
import com.truew8.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenRotationService refreshTokenRotationService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        StaticMessageSource messageSource = new StaticMessageSource();
        java.util.Locale ptBr = java.util.Locale.forLanguageTag("pt-BR");
        java.util.Locale enUs = java.util.Locale.forLanguageTag("en-US");

        messageSource.addMessage("auth.email.exists", enUs, "Email already registered");
        messageSource.addMessage("auth.email.exists", ptBr, "Email already registered");
        messageSource.addMessage("auth.invalid.credentials", enUs, "Invalid credentials");
        messageSource.addMessage("auth.invalid.credentials", ptBr, "Invalid credentials");
        messageSource.addMessage("auth.missing.refresh.token", enUs, "Missing refresh token");
        messageSource.addMessage("auth.missing.refresh.token", ptBr, "Missing refresh token");
        messageSource.addMessage("auth.invalid.refresh.token", enUs, "Invalid refresh token");
        messageSource.addMessage("auth.invalid.refresh.token", ptBr, "Invalid refresh token");
        messageSource.addMessage("auth.user.not.found", enUs, "User not found");
        messageSource.addMessage("auth.user.not.found", ptBr, "User not found");
        messageSource.addMessage("auth.expired.refresh.session", enUs, "Expired refresh session");
        messageSource.addMessage("auth.expired.refresh.session", ptBr, "Expired refresh session");
        MessageResolver messages = new MessageResolver(messageSource);
        authService = new AuthService(userRepository, passwordEncoder, jwtService, refreshTokenRotationService, messages, 1209600000L);
    }

    @Test
    void registerShouldReturnConflictWhenEmailAlreadyExists() {
        AuthRequestDTO request = new AuthRequestDTO("existing@truew8.com", "StrongPass123!");
        when(userRepository.existsByEmail("existing@truew8.com")).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> authService.register(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("Email already registered", exception.getReason());
    }

    @Test
    void registerShouldPersistHashedPasswordAndReturnSession() {
        AuthRequestDTO request = new AuthRequestDTO("new@truew8.com", "StrongPass123!");

        when(userRepository.existsByEmail("new@truew8.com")).thenReturn(false);
        when(passwordEncoder.encode("StrongPass123!")).thenReturn("hashed-password");

        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        savedUser.setEmail("new@truew8.com");
        savedUser.setPasswordHash("hashed-password");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateAccessToken(savedUser)).thenReturn("access-token");
        when(refreshTokenRotationService.issueForUser(savedUser.getId(), 1209600000L)).thenReturn("refresh-id");
        when(jwtService.generateRefreshToken(savedUser, "refresh-id")).thenReturn("refresh-token");

        AuthSession response = authService.register(request);

        assertEquals("new@truew8.com", response.email());
        assertEquals("access-token", response.accessToken());
        assertEquals("refresh-token", response.refreshToken());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User userToPersist = userCaptor.getValue();

        assertEquals("new@truew8.com", userToPersist.getEmail());
        assertEquals("hashed-password", userToPersist.getPasswordHash());
        assertEquals(2, userToPersist.getOcrCount());
    }

    @Test
    void loginShouldReturnUnauthorizedForInvalidPassword() {
        AuthRequestDTO request = new AuthRequestDTO("user@truew8.com", "wrong-pass");

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@truew8.com");
        user.setPasswordHash("stored-hash");

        when(userRepository.findByEmail("user@truew8.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-pass", "stored-hash")).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> authService.login(request));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
        assertEquals("Invalid credentials", exception.getReason());
    }

    @Test
    void loginShouldReturnSessionForValidCredentials() {
        AuthRequestDTO request = new AuthRequestDTO("user@truew8.com", "StrongPass123!");

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@truew8.com");
        user.setPasswordHash("stored-hash");

        when(userRepository.findByEmail("user@truew8.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("StrongPass123!", "stored-hash")).thenReturn(true);
        when(jwtService.generateAccessToken(user)).thenReturn("access-token");
        when(refreshTokenRotationService.issueForUser(user.getId(), 1209600000L)).thenReturn("refresh-id");
        when(jwtService.generateRefreshToken(user, "refresh-id")).thenReturn("refresh-token");

        AuthSession response = authService.login(request);

        assertEquals("access-token", response.accessToken());
        assertEquals("refresh-token", response.refreshToken());
        assertEquals("user@truew8.com", response.email());
        assertTrue(response.accessToken().length() > 0);
        verify(jwtService).generateAccessToken(eq(user));
    }
}
