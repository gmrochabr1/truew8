package com.truew8.dto;

import java.math.BigDecimal;
import java.util.List;

public record CustomizationPreferenceResponseDTO(
        String baseCurrency,
        BigDecimal toleranceValue,
        Boolean allowSells,
        String theme,
        List<String> availableBaseCurrencies,
        List<String> availableThemes
) {
}
