package com.truew8.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AllocationDTO(
        @NotBlank String ticker,
        @NotNull @DecimalMin(value = "0", inclusive = false) @DecimalMax(value = "1", inclusive = true) BigDecimal percentage,
                @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal price,
                String brokerage
) {

        public AllocationDTO(String ticker, BigDecimal percentage, BigDecimal price) {
                this(ticker, percentage, price, null);
        }
}
