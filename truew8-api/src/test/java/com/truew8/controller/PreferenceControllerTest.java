package com.truew8.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.truew8.dto.LocalePreferenceResponseDTO;
import com.truew8.dto.UpdateLocalePreferenceRequestDTO;
import com.truew8.entity.User;
import com.truew8.entity.UserPreference;
import com.truew8.repository.UserPreferenceRepository;
import com.truew8.repository.UserRepository;
import com.truew8.service.MessageResolver;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PreferenceControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPreferenceRepository userPreferenceRepository;

    private PreferenceController preferenceController;

    private User user;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        StaticMessageSource source = new StaticMessageSource();
        source.addMessage("locale.invalid", Locale.ENGLISH, "Locale is not supported for available markets");
        source.addMessage("user.not.authenticated", Locale.ENGLISH, "User not authenticated");
        source.addMessage("auth.user.not.found", Locale.ENGLISH, "User not found");

        MessageResolver messages = new MessageResolver(source);
        preferenceController = new PreferenceController(userRepository, userPreferenceRepository, messages);

        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("locale@test.com");
        authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), "n/a");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        LocaleContextHolder.setLocale(Locale.ENGLISH);
    }

    @Test
    void shouldReturnPersistedLocaleAndAvailableLocales() {
        UserPreference preference = new UserPreference();
        preference.setUser(user);
        preference.setLocalePreference("en-US");
        when(userPreferenceRepository.findByUserId(user.getId())).thenReturn(Optional.of(preference));

        ResponseEntity<LocalePreferenceResponseDTO> response = preferenceController.getLocalePreference(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("en-US", response.getBody().selectedLocale());
        assertEquals("en-US", response.getBody().effectiveLocale());
        assertTrue(response.getBody().availableLocales().contains("pt-BR"));
        assertTrue(response.getBody().availableLocales().contains("en-US"));
    }

    @Test
    void shouldUpdateLocalePreference() {
        UserPreference preference = new UserPreference();
        preference.setUser(user);
        when(userPreferenceRepository.findByUserId(user.getId())).thenReturn(Optional.of(preference));
        when(userPreferenceRepository.save(any(UserPreference.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<LocalePreferenceResponseDTO> response = preferenceController.updateLocalePreference(
                new UpdateLocalePreferenceRequestDTO("pt-BR"),
                authentication
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("pt-BR", response.getBody().selectedLocale());
        assertEquals("pt-BR", response.getBody().effectiveLocale());
        verify(userPreferenceRepository).save(preference);
    }

    @Test
    void shouldRejectUnsupportedLocale() {
        UserPreference preference = new UserPreference();
        preference.setUser(user);
        when(userPreferenceRepository.findByUserId(user.getId())).thenReturn(Optional.of(preference));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> preferenceController.updateLocalePreference(new UpdateLocalePreferenceRequestDTO("fr-FR"), authentication)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Locale is not supported for available markets", exception.getReason());
    }
}
