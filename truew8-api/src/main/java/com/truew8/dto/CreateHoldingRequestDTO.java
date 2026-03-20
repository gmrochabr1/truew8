package com.truew8.dto;

import com.truew8.entity.AssetType;
import com.truew8.entity.Market;
import jakarta.validation.constraints.NotBlank;

public record CreateHoldingRequestDTO(
        @NotBlank String ticker,
        @NotBlank String assetKey,
        @NotBlank String brokerage,
        @NotBlank String quantity,
        @NotBlank String averagePrice,
        Market market,
        AssetType assetType
) {
}
