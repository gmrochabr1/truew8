package com.truew8.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PortfolioSummaryDTO(
        UUID id,
        String name,
        String description,
        int holdingsCount,
        BigDecimal totalInvested
) {
}
