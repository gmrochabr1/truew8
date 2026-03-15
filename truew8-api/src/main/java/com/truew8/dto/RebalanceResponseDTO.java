package com.truew8.dto;

import java.util.List;

public record RebalanceResponseDTO(
        List<OrderActionDTO> orders
) {
}
