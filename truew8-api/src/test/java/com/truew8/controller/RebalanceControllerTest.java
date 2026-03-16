package com.truew8.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.truew8.dto.AllocationDTO;
import com.truew8.dto.AssetDTO;
import com.truew8.dto.OrderActionDTO;
import com.truew8.dto.RebalanceRequestDTO;
import com.truew8.dto.RebalanceResponseDTO;
import com.truew8.dto.TradeAction;
import com.truew8.service.RebalancingEngine;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class RebalanceControllerTest {

    @Mock
    private RebalancingEngine rebalancingEngine;

    @InjectMocks
    private RebalanceController rebalanceController;

    @Captor
    private ArgumentCaptor<RebalanceRequestDTO> requestCaptor;

    @Test
    void shouldNormalizeNullCurrentHoldingsToEmptyList() {
        RebalanceRequestDTO request = new RebalanceRequestDTO(
                new BigDecimal("100.00"),
                null,
                List.of(new AllocationDTO("PETR4", BigDecimal.ONE, new BigDecimal("10.00"), "XP"))
        );

        when(rebalancingEngine.rebalance(any(RebalanceRequestDTO.class))).thenReturn(
                new RebalanceResponseDTO(List.of(
                        new OrderActionDTO(TradeAction.HOLD, "PETR4", BigDecimal.ZERO, BigDecimal.ZERO, "XP")
                ))
        );

        ResponseEntity<RebalanceResponseDTO> response = rebalanceController.rebalance(request);

        verify(rebalancingEngine).rebalance(requestCaptor.capture());
        RebalanceRequestDTO normalized = requestCaptor.getValue();

        assertNotNull(response.getBody());
        assertEquals(0, normalized.currentHoldings().size());
        assertEquals(1, response.getBody().orders().size());
    }

    @Test
    void shouldForwardProvidedCurrentHoldingsWithoutMutatingValues() {
        AssetDTO currentHolding = new AssetDTO("VALE3", new BigDecimal("5"), new BigDecimal("60.00"), "XP");
        RebalanceRequestDTO request = new RebalanceRequestDTO(
                new BigDecimal("200.00"),
                List.of(currentHolding),
                List.of(new AllocationDTO("VALE3", BigDecimal.ONE, new BigDecimal("60.00"), "XP"))
        );

        when(rebalancingEngine.rebalance(any(RebalanceRequestDTO.class))).thenReturn(new RebalanceResponseDTO(List.of()));

        rebalanceController.rebalance(request);

        verify(rebalancingEngine).rebalance(requestCaptor.capture());
        RebalanceRequestDTO normalized = requestCaptor.getValue();

        assertEquals(1, normalized.currentHoldings().size());
        assertEquals("VALE3", normalized.currentHoldings().get(0).ticker());
        assertEquals(0, new BigDecimal("5").compareTo(normalized.currentHoldings().get(0).quantity()));
        assertEquals(0, new BigDecimal("60.00").compareTo(normalized.currentHoldings().get(0).price()));
    }
}
