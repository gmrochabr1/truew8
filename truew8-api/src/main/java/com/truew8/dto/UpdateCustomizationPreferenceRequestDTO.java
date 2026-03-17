package com.truew8.dto;

import java.math.BigDecimal;

public record UpdateCustomizationPreferenceRequestDTO(
        String baseCurrency,
        BigDecimal toleranceValue,
        Boolean allowSells,
        String theme
) {
}
