package com.truew8.dto;

import com.truew8.entity.AssetType;
import com.truew8.entity.Market;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateHoldingRequestDTO(
        @NotBlank String ticker,
        @NotBlank String brokerage,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal quantity,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal averagePrice,
        Market market,
        AssetType assetType
) {
}
