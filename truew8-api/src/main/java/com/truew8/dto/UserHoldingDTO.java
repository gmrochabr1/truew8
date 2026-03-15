package com.truew8.dto;

import com.truew8.entity.AssetType;
import com.truew8.entity.Market;
import java.math.BigDecimal;
import java.util.UUID;

public record UserHoldingDTO(
        UUID id,
        String ticker,
        String brokerage,
        Market market,
        AssetType assetType,
        BigDecimal quantity,
        BigDecimal averagePrice,
        boolean isLocked
) {
}
