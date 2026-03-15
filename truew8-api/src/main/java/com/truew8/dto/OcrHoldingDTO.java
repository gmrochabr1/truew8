package com.truew8.dto;

import java.math.BigDecimal;

public record OcrHoldingDTO(
        String ticker,
        BigDecimal quantity
) {
}
