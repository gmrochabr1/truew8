package com.truew8.dto;

import java.util.List;

public record LocalePreferenceResponseDTO(
        String selectedLocale,
        String effectiveLocale,
        List<String> availableLocales
) {
}
