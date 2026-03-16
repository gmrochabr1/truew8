package com.truew8.service;

import com.truew8.dto.OrderActionDTO;
import com.truew8.dto.RebalanceResponseDTO;
import com.truew8.dto.TargetAllocationDTO;
import com.truew8.dto.TradeAction;
import com.truew8.entity.AssetType;
import com.truew8.entity.Market;
import com.truew8.entity.UserHolding;
import com.truew8.entity.UserPreference;
import com.truew8.repository.UserHoldingRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class RebalanceEngineService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int MONEY_SCALE = 2;

    private final UserHoldingRepository userHoldingRepository;

    public RebalanceEngineService(UserHoldingRepository userHoldingRepository) {
        this.userHoldingRepository = userHoldingRepository;
    }

    public RebalanceResponseDTO calculateRebalance(UUID portfolioId, BigDecimal newDeposit,
            List<TargetAllocationDTO> targets, UserPreference preferences) {
        List<UserHolding> holdings = userHoldingRepository.findByPortfolioId(portfolioId);

        Set<String> lockedTickers = collectLockedTickers(holdings);
        Map<String, UserHolding> unlockedByTicker = buildUnlockedHoldingsByTicker(holdings);

        BigDecimal sanitizedDeposit = safePositive(newDeposit);
        BigDecimal tolerance = resolveTolerance(preferences);
        boolean allowSells = isAllowSells(preferences);

        BigDecimal unlockedPortfolioValue =
                calculateUnlockedPortfolioValue(unlockedByTicker.values());
        BigDecimal rebalanceBaseValue = unlockedPortfolioValue.add(sanitizedDeposit);

        List<TargetComputation> computations = buildTargetComputations(targets, lockedTickers,
                unlockedByTicker, rebalanceBaseValue, allowSells, tolerance);

        BigDecimal totalBuyNeed = totalBuyNeed(computations);
        BigDecimal availableForBuys =
                allowSells ? BigDecimal.ZERO : sanitizedDeposit.min(totalBuyNeed);

        List<OrderActionDTO> orders = new ArrayList<>();
        for (TargetComputation computation : computations) {
            orders.addAll(
                    toOrders(computation, allowSells, availableForBuys, totalBuyNeed, tolerance));
        }

        return new RebalanceResponseDTO(orders);
    }

    private Map<String, UserHolding> buildUnlockedHoldingsByTicker(List<UserHolding> holdings) {
        Map<String, UserHolding> map = new LinkedHashMap<>();
        for (UserHolding holding : holdings) {
            if (Boolean.TRUE.equals(holding.getIsLocked())) {
                continue;
            }
            map.putIfAbsent(normalizeTicker(holding.getTicker()), holding);
        }
        return map;
    }

    private Set<String> collectLockedTickers(List<UserHolding> holdings) {
        Set<String> lockedTickers = new HashSet<>();
        for (UserHolding holding : holdings) {
            if (Boolean.TRUE.equals(holding.getIsLocked())) {
                lockedTickers.add(normalizeTicker(holding.getTicker()));
            }
        }
        return lockedTickers;
    }

    private List<TargetComputation> buildTargetComputations(List<TargetAllocationDTO> targets,
            Set<String> lockedTickers, Map<String, UserHolding> unlockedByTicker,
            BigDecimal rebalanceBaseValue, boolean allowSells, BigDecimal tolerance) {
        List<TargetComputation> computations = new ArrayList<>();
        if (targets == null) {
            return computations;
        }

        for (TargetAllocationDTO target : targets) {
            String ticker = normalizeTicker(target.ticker());
            if (ticker.isBlank() || lockedTickers.contains(ticker)) {
                continue;
            }

            UserHolding currentHolding = unlockedByTicker.get(ticker);
            BigDecimal currentValue = holdingValue(currentHolding);
            BigDecimal targetValue = rebalanceBaseValue.multiply(safePositive(target.percentage()));
            BigDecimal rawDifference = targetValue.subtract(currentValue);

            TradeAction plannedAction = resolveAction(rawDifference, allowSells, tolerance);

            computations.add(new TargetComputation(ticker, resolveBrokerage(target, currentHolding),
                    resolvePrice(target, currentHolding), resolveMarket(target, currentHolding),
                    resolveAssetType(target, currentHolding), rawDifference, plannedAction));
        }

        return computations;
    }

    private List<OrderActionDTO> toOrders(TargetComputation computation, boolean allowSells,
            BigDecimal availableForBuys, BigDecimal totalBuyNeed, BigDecimal tolerance) {
        if (computation.action == TradeAction.HOLD) {
            return List.of(holdOrder(computation.ticker, computation.brokerage));
        }

        BigDecimal orderDifference = computation.difference;

        if (!allowSells && computation.action == TradeAction.BUY) {
            orderDifference =
                    proportionalBuyDifference(orderDifference, availableForBuys, totalBuyNeed);
            if (orderDifference.abs().compareTo(tolerance) < 0) {
                return List.of(holdOrder(computation.ticker, computation.brokerage));
            }
        }

        if (orderDifference.compareTo(BigDecimal.ZERO) == 0) {
            return List.of(holdOrder(computation.ticker, computation.brokerage));
        }

        return buildOrdersForDifference(computation, orderDifference);
    }

    private BigDecimal proportionalBuyDifference(BigDecimal difference, BigDecimal availableForBuys,
            BigDecimal totalBuyNeed) {
        if (totalBuyNeed.compareTo(BigDecimal.ZERO) <= 0
                || availableForBuys.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        return difference.multiply(availableForBuys).divide(totalBuyNeed, 8, RoundingMode.DOWN);
    }

    private List<OrderActionDTO> buildOrdersForDifference(TargetComputation computation,
            BigDecimal difference) {
        if (computation.price.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of(holdOrder(computation.ticker, computation.brokerage));
        }

        TradeAction action =
                difference.compareTo(BigDecimal.ZERO) > 0 ? TradeAction.BUY : TradeAction.SELL;
        BigDecimal absoluteDiff = difference.abs();

        if (isB3StandardLot(computation.market, computation.assetType)) {
            return buildB3Orders(computation, action, absoluteDiff);
        }

        return buildExactQuantityOrder(computation, action, absoluteDiff);
    }

    private List<OrderActionDTO> buildB3Orders(TargetComputation computation, TradeAction action,
            BigDecimal absoluteDiff) {
        BigDecimal rawQuantity = absoluteDiff.divide(computation.price, 8, RoundingMode.DOWN);
        BigDecimal integerQuantity = rawQuantity.setScale(0, RoundingMode.DOWN);

        if (integerQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of(holdOrder(computation.ticker, computation.brokerage));
        }

        BigDecimal standardQuantity =
                integerQuantity.divide(HUNDRED, 0, RoundingMode.DOWN).multiply(HUNDRED);
        BigDecimal fractionalQuantity = integerQuantity.remainder(HUNDRED);

        List<OrderActionDTO> orders = new ArrayList<>();
        if (standardQuantity.compareTo(BigDecimal.ZERO) > 0) {
            orders.add(order(action, computation.ticker, standardQuantity, computation.price,
                    computation.brokerage));
        }
        if (fractionalQuantity.compareTo(BigDecimal.ZERO) > 0) {
            orders.add(order(action, fractionalTicker(computation.ticker), fractionalQuantity,
                    computation.price, computation.brokerage));
        }

        if (orders.isEmpty()) {
            return List.of(holdOrder(computation.ticker, computation.brokerage));
        }
        return orders;
    }

    private List<OrderActionDTO> buildExactQuantityOrder(TargetComputation computation,
            TradeAction action, BigDecimal absoluteDiff) {
        int quantityScale = quantityScaleFor(computation.assetType, computation.market);
        BigDecimal quantity =
                absoluteDiff.divide(computation.price, quantityScale, RoundingMode.DOWN);

        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of(holdOrder(computation.ticker, computation.brokerage));
        }

        return List.of(order(action, computation.ticker, quantity, computation.price,
                computation.brokerage));
    }

    private BigDecimal totalBuyNeed(List<TargetComputation> computations) {
        BigDecimal total = BigDecimal.ZERO;
        for (TargetComputation computation : computations) {
            if (computation.action == TradeAction.BUY) {
                total = total.add(computation.difference);
            }
        }
        return total;
    }

    private TradeAction resolveAction(BigDecimal difference, boolean allowSells,
            BigDecimal tolerance) {
        if (difference.abs().compareTo(tolerance) < 0) {
            return TradeAction.HOLD;
        }
        if (difference.compareTo(BigDecimal.ZERO) > 0) {
            return TradeAction.BUY;
        }
        if (allowSells) {
            return TradeAction.SELL;
        }
        return TradeAction.HOLD;
    }

    private BigDecimal calculateUnlockedPortfolioValue(Iterable<UserHolding> holdings) {
        BigDecimal total = BigDecimal.ZERO;
        for (UserHolding holding : holdings) {
            total = total.add(holdingValue(holding));
        }
        return total;
    }

    private BigDecimal holdingValue(UserHolding holding) {
        if (holding == null || holding.getQuantity() == null || holding.getAveragePrice() == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal quantity = parseHoldingDecimal(holding.getQuantity());
        BigDecimal averagePrice = parseHoldingDecimal(holding.getAveragePrice());
        return quantity.multiply(averagePrice);
    }

    private String resolveBrokerage(TargetAllocationDTO target, UserHolding holding) {
        if (target.brokerage() != null && !target.brokerage().isBlank()) {
            return target.brokerage();
        }
        if (holding != null) {
            return holding.getBrokerage();
        }
        return null;
    }

    private BigDecimal resolvePrice(TargetAllocationDTO target, UserHolding holding) {
        if (target.quotePrice() != null && target.quotePrice().compareTo(BigDecimal.ZERO) > 0) {
            return target.quotePrice();
        }
        if (holding != null && holding.getAveragePrice() != null) {
            BigDecimal holdingPrice = parseHoldingDecimal(holding.getAveragePrice());
            if (holdingPrice.compareTo(BigDecimal.ZERO) > 0) {
                return holdingPrice;
            }
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal parseHoldingDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return BigDecimal.ZERO;
        }

        try {
            return new BigDecimal(raw.trim());
        } catch (NumberFormatException ignored) {
            // Ciphertext or malformed legacy value must not break rebalance execution.
            return BigDecimal.ZERO;
        }
    }

    private Market resolveMarket(TargetAllocationDTO target, UserHolding holding) {
        if (target.market() != null) {
            return target.market();
        }
        return holding != null ? holding.getMarket() : null;
    }

    private AssetType resolveAssetType(TargetAllocationDTO target, UserHolding holding) {
        if (target.assetType() != null) {
            return target.assetType();
        }
        return holding != null ? holding.getAssetType() : null;
    }

    private int quantityScaleFor(AssetType assetType, Market market) {
        if (assetType == AssetType.CRYPTO || market == Market.CRYPTO) {
            return 8;
        }
        return 4;
    }

    private boolean isB3StandardLot(Market market, AssetType assetType) {
        return market == Market.B3 && assetType == AssetType.STOCK;
    }

    private String fractionalTicker(String ticker) {
        if (ticker.endsWith("F")) {
            return ticker;
        }
        return ticker + "F";
    }

    private OrderActionDTO holdOrder(String ticker, String brokerage) {
        return new OrderActionDTO(TradeAction.HOLD, ticker, BigDecimal.ZERO,
                BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP), brokerage);
    }

    private OrderActionDTO order(TradeAction action, String ticker, BigDecimal quantity,
            BigDecimal price, String brokerage) {
        BigDecimal estimatedValue =
                quantity.multiply(price).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        return new OrderActionDTO(action, ticker, quantity, estimatedValue, brokerage);
    }

    private BigDecimal resolveTolerance(UserPreference preferences) {
        if (preferences == null || preferences.getToleranceValue() == null) {
            return new BigDecimal("10.00");
        }
        return preferences.getToleranceValue();
    }

    private boolean isAllowSells(UserPreference preferences) {
        return preferences == null || !Boolean.FALSE.equals(preferences.getAllowSells());
    }

    private BigDecimal safePositive(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        return value;
    }

    private String normalizeTicker(String ticker) {
        if (ticker == null) {
            return "";
        }
        return ticker.trim().toUpperCase(Locale.ROOT);
    }

    private static final class TargetComputation {
        private final String ticker;
        private final String brokerage;
        private final BigDecimal price;
        private final Market market;
        private final AssetType assetType;
        private final BigDecimal difference;
        private final TradeAction action;

        private TargetComputation(String ticker, String brokerage, BigDecimal price, Market market,
                AssetType assetType, BigDecimal difference, TradeAction action) {
            this.ticker = Objects.requireNonNullElse(ticker, "");
            this.brokerage = brokerage;
            this.price = Objects.requireNonNullElse(price, BigDecimal.ZERO);
            this.market = market;
            this.assetType = assetType;
            this.difference = Objects.requireNonNullElse(difference, BigDecimal.ZERO);
            this.action = Objects.requireNonNullElse(action, TradeAction.HOLD);
        }
    }
}
