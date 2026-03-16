package com.truew8.dto;

import com.truew8.entity.AssetType;
import com.truew8.entity.Market;
import java.math.BigDecimal;

public record TargetAllocationDTO(
        String ticker,
        BigDecimal percentage,
        BigDecimal quotePrice,
        Market market,
        AssetType assetType,
        String brokerage
) {
}
