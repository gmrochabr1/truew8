package com.truew8.controller;

import com.truew8.dto.LocalePreferenceResponseDTO;
import com.truew8.dto.UpdateLocalePreferenceRequestDTO;
import com.truew8.entity.Market;
import com.truew8.entity.User;
import com.truew8.entity.UserPreference;
import com.truew8.repository.UserPreferenceRepository;
import com.truew8.repository.UserRepository;
import com.truew8.service.MessageResolver;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/preferences")
public class PreferenceController {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final MessageResolver messages;

    public PreferenceController(
            UserRepository userRepository,
            UserPreferenceRepository userPreferenceRepository,
            MessageResolver messages
    ) {
        this.userRepository = userRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.messages = messages;
    }

    @GetMapping("/locale")
    @Transactional
    public ResponseEntity<LocalePreferenceResponseDTO> getLocalePreference(Authentication authentication) {
        User user = resolveUser(authentication);
        UserPreference preference = ensurePreference(user);

        List<String> availableLocales = resolveAvailableLocales();
        String selectedLocale = normalizeLocaleTag(preference.getLocalePreference());
        if (selectedLocale != null && !availableLocales.contains(selectedLocale)) {
            selectedLocale = null;
            preference.setLocalePreference(null);
            userPreferenceRepository.save(preference);
        }

        String effectiveLocale = selectedLocale != null
            ? selectedLocale
            : detectAutoLocale(availableLocales, LocaleContextHolder.getLocale());

        return ResponseEntity.ok(new LocalePreferenceResponseDTO(selectedLocale, effectiveLocale, availableLocales));
    }

    @PutMapping("/locale")
    @Transactional
    public ResponseEntity<LocalePreferenceResponseDTO> updateLocalePreference(
            @RequestBody(required = false) UpdateLocalePreferenceRequestDTO request,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        UserPreference preference = ensurePreference(user);

        List<String> availableLocales = resolveAvailableLocales();
        String requested = request != null ? request.locale() : null;
        String selectedLocale = normalizeLocaleTag(requested);

        if (requested != null && !requested.isBlank() && selectedLocale == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, messages.get("locale.invalid"));
        }

        if (selectedLocale != null && !availableLocales.contains(selectedLocale)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, messages.get("locale.invalid"));
        }

        preference.setLocalePreference(selectedLocale);
        userPreferenceRepository.save(preference);

        String effectiveLocale = selectedLocale != null
            ? selectedLocale
            : detectAutoLocale(availableLocales, LocaleContextHolder.getLocale());

        return ResponseEntity.ok(new LocalePreferenceResponseDTO(selectedLocale, effectiveLocale, availableLocales));
    }

    private UserPreference ensurePreference(User user) {
        return userPreferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserPreference preference = new UserPreference();
                    preference.setUser(user);
                    return userPreferenceRepository.save(preference);
                });
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, messages.get("user.not.authenticated"));
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, messages.get("auth.user.not.found")));
    }

    private List<String> resolveAvailableLocales() {
        Set<String> locales = new LinkedHashSet<>();

        for (Market market : Market.values()) {
            if (market == Market.B3) {
                locales.add("pt-BR");
            } else {
                locales.add("en-US");
            }
        }

        if (locales.isEmpty()) {
            locales.add("pt-BR");
        }

        List<String> ordered = new ArrayList<>();
        if (locales.contains("pt-BR")) {
            ordered.add("pt-BR");
        }
        if (locales.contains("en-US")) {
            ordered.add("en-US");
        }
        return ordered;
    }

    private String detectAutoLocale(List<String> availableLocales, Locale locale) {
        String normalized = normalizeLocaleTag(locale != null ? locale.toLanguageTag() : null);
        if (normalized != null && availableLocales.contains(normalized)) {
            return normalized;
        }

        if (availableLocales.contains("pt-BR")) {
            return "pt-BR";
        }

        return availableLocales.get(0);
    }

    private String normalizeLocaleTag(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }

        String normalized = input.trim().toLowerCase(Locale.ROOT);
        if (normalized.startsWith("pt")) {
            return "pt-BR";
        }
        if (normalized.startsWith("en")) {
            return "en-US";
        }
        return null;
    }
}
