package com.truew8.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record RebalanceRequestDTO(
        @NotNull @DecimalMin(value = "0", inclusive = true) BigDecimal newDeposit,
        @NotNull List<@Valid AssetDTO> currentHoldings,
        @NotEmpty List<@Valid AllocationDTO> targetPortfolio
) {
}
