package com.truew8.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.truew8.dto.OrderActionDTO;
import com.truew8.dto.RebalanceResponseDTO;
import com.truew8.dto.TargetAllocationDTO;
import com.truew8.dto.TradeAction;
import com.truew8.entity.AssetType;
import com.truew8.entity.Market;
import com.truew8.entity.Portfolio;
import com.truew8.entity.UserHolding;
import com.truew8.entity.UserPreference;
import com.truew8.repository.UserHoldingRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RebalanceEngineServiceTest {

    @Mock
    private UserHoldingRepository userHoldingRepository;

    @InjectMocks
    private RebalanceEngineService rebalanceEngineService;

    @Test
    void shouldApplyBastterModeWithoutGeneratingSellOrders() {
        UUID portfolioId = UUID.randomUUID();

        UserHolding petr4 = createHolding(
                portfolioId,
                "PETR4",
                "XP",
                Market.B3,
                AssetType.STOCK,
                new BigDecimal("100"),
                new BigDecimal("10.00"),
                false
        );

        UserHolding mxrf11 = createHolding(
                portfolioId,
                "MXRF11",
                "XP",
                Market.B3,
                AssetType.FII,
                new BigDecimal("10"),
                new BigDecimal("10.00"),
                false
        );

        when(userHoldingRepository.findByPortfolioId(portfolioId)).thenReturn(List.of(petr4, mxrf11));

        UserPreference preferences = new UserPreference();
        preferences.setAllowSells(false);
        preferences.setToleranceValue(new BigDecimal("1.00"));

        List<TargetAllocationDTO> targets = List.of(
                new TargetAllocationDTO("PETR4", new BigDecimal("0.50"), new BigDecimal("10.00"), Market.B3, AssetType.STOCK, "XP"),
                new TargetAllocationDTO("MXRF11", new BigDecimal("0.50"), new BigDecimal("10.00"), Market.B3, AssetType.FII, "XP")
        );

        RebalanceResponseDTO response = rebalanceEngineService.calculateRebalance(
                portfolioId,
                new BigDecimal("100.00"),
                targets,
                preferences
        );

        assertTrue(response.orders().stream().noneMatch(order -> order.action() == TradeAction.SELL));

        OrderActionDTO petrOrder = response.orders().stream()
                .filter(order -> "PETR4".equals(order.ticker()))
                .findFirst()
                .orElseThrow();
        assertEquals(TradeAction.HOLD, petrOrder.action());

        OrderActionDTO mxrfOrder = response.orders().stream()
                .filter(order -> "MXRF11".equals(order.ticker()))
                .findFirst()
                .orElseThrow();
        assertEquals(TradeAction.BUY, mxrfOrder.action());
        assertEquals(0, new BigDecimal("10").compareTo(mxrfOrder.quantity()));
        assertEquals("XP", mxrfOrder.brokerage());
    }

    @Test
    void shouldSplitB3OrdersIntoStandardAndFractionalLots() {
        UUID portfolioId = UUID.randomUUID();
        when(userHoldingRepository.findByPortfolioId(portfolioId)).thenReturn(List.of());

        UserPreference preferences = new UserPreference();
        preferences.setAllowSells(true);
        preferences.setToleranceValue(new BigDecimal("1.00"));

        List<TargetAllocationDTO> targets = List.of(
                new TargetAllocationDTO("PETR4", BigDecimal.ONE, new BigDecimal("10.00"), Market.B3, AssetType.STOCK, "XP")
        );

        RebalanceResponseDTO response = rebalanceEngineService.calculateRebalance(
                portfolioId,
                new BigDecimal("1350.00"),
                targets,
                preferences
        );

        assertEquals(2, response.orders().size());

        OrderActionDTO standardOrder = response.orders().stream()
                .filter(order -> "PETR4".equals(order.ticker()))
                .findFirst()
                .orElseThrow();
        assertEquals(TradeAction.BUY, standardOrder.action());
        assertEquals(0, new BigDecimal("100").compareTo(standardOrder.quantity()));

        OrderActionDTO fractionalOrder = response.orders().stream()
                .filter(order -> "PETR4F".equals(order.ticker()))
                .findFirst()
                .orElseThrow();
        assertEquals(TradeAction.BUY, fractionalOrder.action());
        assertEquals(0, new BigDecimal("35").compareTo(fractionalOrder.quantity()));
    }

    @Test
    void shouldIgnoreLockedAssetsInTotalPortfolioValue() {
        UUID portfolioId = UUID.randomUUID();

        UserHolding vale3Locked = createHolding(
                portfolioId,
                "VALE3",
                "XP",
                Market.B3,
                AssetType.STOCK,
                new BigDecimal("1000"),
                new BigDecimal("100.00"),
                true
        );
        UserHolding itub4Unlocked = createHolding(
                portfolioId,
                "ITUB4",
                "XP",
                Market.B3,
                AssetType.FII,
                new BigDecimal("10"),
                new BigDecimal("10.00"),
                false
        );

        when(userHoldingRepository.findByPortfolioId(portfolioId)).thenReturn(List.of(vale3Locked, itub4Unlocked));

        UserPreference preferences = new UserPreference();
        preferences.setAllowSells(true);
        preferences.setToleranceValue(new BigDecimal("1.00"));

        List<TargetAllocationDTO> targets = List.of(
                new TargetAllocationDTO("ITUB4", BigDecimal.ONE, new BigDecimal("10.00"), Market.B3, AssetType.FII, "XP")
        );

        RebalanceResponseDTO response = rebalanceEngineService.calculateRebalance(
                portfolioId,
                new BigDecimal("100.00"),
                targets,
                preferences
        );

        assertEquals(1, response.orders().size());
        OrderActionDTO itubOrder = response.orders().get(0);
        assertEquals(TradeAction.BUY, itubOrder.action());
        assertEquals("ITUB4", itubOrder.ticker());
        assertEquals(0, new BigDecimal("10").compareTo(itubOrder.quantity()));
    }

    @Test
    void shouldRespectCryptoDecimalPrecision() {
        UUID portfolioId = UUID.randomUUID();
        when(userHoldingRepository.findByPortfolioId(portfolioId)).thenReturn(List.of());

        UserPreference preferences = new UserPreference();
        preferences.setAllowSells(true);
        preferences.setToleranceValue(new BigDecimal("0.01"));

        List<TargetAllocationDTO> targets = List.of(
                new TargetAllocationDTO("BTC", BigDecimal.ONE, new BigDecimal("10000.00"), Market.CRYPTO, AssetType.CRYPTO, "Binance")
        );

        RebalanceResponseDTO response = rebalanceEngineService.calculateRebalance(
                portfolioId,
                new BigDecimal("15.50"),
                targets,
                preferences
        );

        assertEquals(1, response.orders().size());
        OrderActionDTO btcOrder = response.orders().get(0);
        assertEquals(TradeAction.BUY, btcOrder.action());
        assertEquals("BTC", btcOrder.ticker());
        assertTrue(btcOrder.quantity().compareTo(BigDecimal.ZERO) > 0);
        assertEquals(0, new BigDecimal("0.00155").compareTo(btcOrder.quantity()));
    }

    @Test
    void shouldHoldWhenDifferenceIsBelowTolerance() {
        UUID portfolioId = UUID.randomUUID();

        UserHolding petr4 = createHolding(
                portfolioId,
                "PETR4",
                "XP",
                Market.B3,
                AssetType.STOCK,
                new BigDecimal("8"),
                new BigDecimal("10.00"),
                false
        );
        when(userHoldingRepository.findByPortfolioId(portfolioId)).thenReturn(List.of(petr4));

        UserPreference preferences = new UserPreference();
        preferences.setAllowSells(true);
        preferences.setToleranceValue(new BigDecimal("50.00"));

        List<TargetAllocationDTO> targets = List.of(
                new TargetAllocationDTO("PETR4", BigDecimal.ONE, new BigDecimal("10.00"), Market.B3, AssetType.STOCK, "XP")
        );

        RebalanceResponseDTO response = rebalanceEngineService.calculateRebalance(
                portfolioId,
                new BigDecimal("20.00"),
                targets,
                preferences
        );

        assertEquals(1, response.orders().size());
        OrderActionDTO order = response.orders().get(0);
        assertEquals(TradeAction.HOLD, order.action());
        assertEquals("PETR4", order.ticker());
        assertEquals(0, BigDecimal.ZERO.compareTo(order.quantity()));
    }

    private UserHolding createHolding(
            UUID portfolioId,
            String ticker,
            String brokerage,
            Market market,
            AssetType assetType,
            BigDecimal quantity,
            BigDecimal averagePrice,
            boolean isLocked
    ) {
        Portfolio portfolio = new Portfolio();
        portfolio.setId(portfolioId);

        UserHolding holding = new UserHolding();
        holding.setPortfolio(portfolio);
        holding.setTicker(ticker);
        holding.setBrokerage(brokerage);
        holding.setMarket(market);
        holding.setAssetType(assetType);
        holding.setQuantity(quantity);
        holding.setAveragePrice(averagePrice);
        holding.setIsLocked(isLocked);
        return holding;
    }
}
