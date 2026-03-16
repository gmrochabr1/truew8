package com.truew8.dto;

import java.math.BigDecimal;

public record OrderActionDTO(
        TradeAction action,
        String ticker,
        BigDecimal quantity,
        BigDecimal estimatedValue,
        String brokerage
) {

    public OrderActionDTO(TradeAction action, String ticker, BigDecimal quantity, BigDecimal estimatedValue) {
        this(action, ticker, quantity, estimatedValue, null);
    }
}
