package com.truew8.dto;

import com.truew8.entity.AssetType;
import com.truew8.entity.Market;
import java.util.UUID;

public record UserHoldingDTO(
        UUID id,
        UUID portfolioId,
        String ticker,
        String brokerage,
        Market market,
        AssetType assetType,
        String quantity,
        String averagePrice,
        boolean isLocked
) {
}
