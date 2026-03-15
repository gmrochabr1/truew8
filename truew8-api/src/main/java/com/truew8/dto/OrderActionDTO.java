package com.truew8.dto;

import java.math.BigDecimal;

public record OrderActionDTO(
        TradeAction action,
        String ticker,
        BigDecimal quantity,
        BigDecimal estimatedValue
) {
}
