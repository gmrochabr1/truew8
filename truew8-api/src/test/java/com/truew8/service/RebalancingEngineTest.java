package com.truew8.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.truew8.dto.AllocationDTO;
import com.truew8.dto.AssetDTO;
import com.truew8.dto.OrderActionDTO;
import com.truew8.dto.RebalanceRequestDTO;
import com.truew8.dto.RebalanceResponseDTO;
import com.truew8.dto.TradeAction;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class RebalancingEngineTest {

    private final RebalancingEngine engine = new RebalancingEngine();

    @Test
    void shouldGenerateOnlyBuysWhenAddingNewDepositToEmptyPortfolio() {
        RebalanceRequestDTO request = new RebalanceRequestDTO(
                new BigDecimal("10000.00"),
                List.of(),
                List.of(
                        new AllocationDTO("PETR4", new BigDecimal("0.50"), new BigDecimal("30.00")),
                        new AllocationDTO("VALE3", new BigDecimal("0.50"), new BigDecimal("50.00"))
                )
        );

        RebalanceResponseDTO response = engine.rebalance(request);

        assertEquals(2, response.orders().size());
        assertEquals(TradeAction.BUY, response.orders().get(0).action());
        assertEquals("PETR4", response.orders().get(0).ticker());
        assertEquals(new BigDecimal("100"), response.orders().get(0).quantity());

        assertEquals(TradeAction.BUY, response.orders().get(1).action());
        assertEquals("VALE3", response.orders().get(1).ticker());
        assertEquals(new BigDecimal("100"), response.orders().get(1).quantity());
    }

    @Test
    void shouldGenerateSellWhenHoldingExceedsTarget() {
        RebalanceRequestDTO request = new RebalanceRequestDTO(
                new BigDecimal("0.00"),
                List.of(new AssetDTO("PETR4", new BigDecimal("500"), new BigDecimal("30.00"))),
                List.of(new AllocationDTO("PETR4", new BigDecimal("0.30"), new BigDecimal("30.00")))
        );

        RebalanceResponseDTO response = engine.rebalance(request);
        OrderActionDTO order = response.orders().get(0);

        assertEquals(TradeAction.SELL, order.action());
        assertEquals("PETR4", order.ticker());
        assertEquals(new BigDecimal("300"), order.quantity());
        assertEquals(new BigDecimal("9000.00"), order.estimatedValue());
    }

    @Test
    void shouldRoundToStandardAndFractionalLotRules() {
        RebalanceRequestDTO request = new RebalanceRequestDTO(
                new BigDecimal("515.00"),
                List.of(),
                List.of(
                        new AllocationDTO("ITUB4", new BigDecimal("0.50"), new BigDecimal("2.53")),
                        new AllocationDTO("ITUB4F", new BigDecimal("0.50"), new BigDecimal("2.53"))
                )
        );

        RebalanceResponseDTO response = engine.rebalance(request);
        OrderActionDTO standardLotOrder = response.orders().get(0);
        OrderActionDTO fractionalOrder = response.orders().get(1);

        assertEquals(TradeAction.BUY, standardLotOrder.action());
        assertEquals(new BigDecimal("100"), standardLotOrder.quantity());

        assertEquals(TradeAction.BUY, fractionalOrder.action());
        assertEquals(new BigDecimal("101"), fractionalOrder.quantity());
    }

    @Test
    void shouldGenerateBuyForSingleAssetTargetWhenDepositIsPositive() {
        RebalanceRequestDTO request = new RebalanceRequestDTO(
                new BigDecimal("100.00"),
                List.of(new AssetDTO("PETR4", new BigDecimal("10"), new BigDecimal("50.00"))),
                List.of(new AllocationDTO("PETR4", BigDecimal.ONE, new BigDecimal("50.00")))
        );

        RebalanceResponseDTO response = engine.rebalance(request);
        OrderActionDTO order = response.orders().get(0);

        assertEquals(TradeAction.BUY, order.action());
        assertEquals("PETR4", order.ticker());
        assertEquals(new BigDecimal("2"), order.quantity());
        assertEquals(new BigDecimal("100.00"), order.estimatedValue());
    }

    @Test
    void shouldFallbackToCurrentHoldingPriceWhenTargetPriceIsZero() {
        RebalanceRequestDTO request = new RebalanceRequestDTO(
                new BigDecimal("100.00"),
                List.of(new AssetDTO("PETR4", new BigDecimal("10"), new BigDecimal("50.00"))),
                List.of(new AllocationDTO("PETR4", BigDecimal.ONE, BigDecimal.ZERO))
        );

        RebalanceResponseDTO response = engine.rebalance(request);
        OrderActionDTO order = response.orders().get(0);

        assertEquals(TradeAction.BUY, order.action());
        assertEquals("PETR4", order.ticker());
        assertEquals(new BigDecimal("2"), order.quantity());
        assertEquals(new BigDecimal("100.00"), order.estimatedValue());
    }

        @Test
        void shouldSuggestFractionalBuyWhenDepositIsSmallButCanBuyAtLeastOneShare() {
                RebalanceRequestDTO request = new RebalanceRequestDTO(
                                new BigDecimal("9.00"),
                                List.of(),
                                List.of(new AllocationDTO("PETR4", BigDecimal.ONE, new BigDecimal("3.00")))
                );

                RebalanceResponseDTO response = engine.rebalance(request);
                OrderActionDTO order = response.orders().get(0);

                assertEquals(TradeAction.BUY, order.action());
                assertEquals("PETR4", order.ticker());
                assertEquals(new BigDecimal("3"), order.quantity());
                assertEquals(new BigDecimal("9.00"), order.estimatedValue());
        }
}
