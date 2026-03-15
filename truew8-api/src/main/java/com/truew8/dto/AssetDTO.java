package com.truew8.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AssetDTO(
        @NotBlank String ticker,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal quantity,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal price
) {
}
