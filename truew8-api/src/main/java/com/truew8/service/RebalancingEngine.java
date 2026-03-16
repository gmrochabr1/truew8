package com.truew8.service;

import com.truew8.dto.AllocationDTO;
import com.truew8.dto.AssetDTO;
import com.truew8.dto.OrderActionDTO;
import com.truew8.dto.RebalanceRequestDTO;
import com.truew8.dto.RebalanceResponseDTO;
import com.truew8.dto.TradeAction;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class RebalancingEngine {

    private static final BigDecimal TOLERANCE = new BigDecimal("10.00");
    private static final BigDecimal STANDARD_LOT = new BigDecimal("100");
    private static final int MONEY_SCALE = 2;

    public RebalanceResponseDTO rebalance(RebalanceRequestDTO request) {
        Map<String, AssetDTO> holdingsByTicker = new LinkedHashMap<>();
        for (AssetDTO holding : request.currentHoldings()) {
            holdingsByTicker.put(normalizeTicker(holding.ticker()), holding);
        }

        BigDecimal currentValue = calculateCurrentPortfolioValue(request.currentHoldings());
        BigDecimal totalPortfolioValue = currentValue.add(request.newDeposit());

        List<OrderActionDTO> orders = new ArrayList<>();
        Map<String, AllocationDTO> targetByTicker = new LinkedHashMap<>();

        for (AllocationDTO allocation : request.targetPortfolio()) {
            String ticker = normalizeTicker(allocation.ticker());
            targetByTicker.put(ticker, allocation);

            BigDecimal targetValue = totalPortfolioValue.multiply(allocation.percentage());
            BigDecimal currentAssetValue = BigDecimal.ZERO;
            AssetDTO currentAsset = holdingsByTicker.get(ticker);
            if (currentAsset != null) {
                currentAssetValue = currentAsset.quantity().multiply(currentAsset.price());
            }

            String brokerage = allocation.brokerage();
            if ((brokerage == null || brokerage.isBlank()) && currentAsset != null) {
                brokerage = currentAsset.brokerage();
            }

            orders.add(createOrderFromDiff(ticker, allocation.price(), targetValue.subtract(currentAssetValue), brokerage));
        }

        for (AssetDTO holding : request.currentHoldings()) {
            String ticker = normalizeTicker(holding.ticker());
            if (!targetByTicker.containsKey(ticker)) {
                BigDecimal currentAssetValue = holding.quantity().multiply(holding.price());
                orders.add(createOrderFromDiff(ticker, holding.price(), currentAssetValue.negate(), holding.brokerage()));
            }
        }

        return new RebalanceResponseDTO(orders);
    }

    private BigDecimal calculateCurrentPortfolioValue(List<AssetDTO> currentHoldings) {
        BigDecimal total = BigDecimal.ZERO;
        for (AssetDTO asset : currentHoldings) {
            total = total.add(asset.quantity().multiply(asset.price()));
        }
        return total;
    }

    private OrderActionDTO createOrderFromDiff(String ticker, BigDecimal price, BigDecimal diffValue, String brokerage) {
        if (diffValue.abs().compareTo(TOLERANCE) < 0) {
            return holdOrder(ticker, brokerage);
        }

        BigDecimal quantity = calculateOrderQuantity(ticker, price, diffValue.abs());
        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return holdOrder(ticker, brokerage);
        }

        TradeAction action = diffValue.compareTo(BigDecimal.ZERO) > 0 ? TradeAction.BUY : TradeAction.SELL;
        BigDecimal estimatedValue = quantity.multiply(price).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return new OrderActionDTO(action, ticker, quantity, estimatedValue, brokerage);
    }

    private BigDecimal calculateOrderQuantity(String ticker, BigDecimal price, BigDecimal absoluteDiff) {
        BigDecimal rawQuantity = absoluteDiff.divide(price, 8, RoundingMode.DOWN);

        if (isFractionalTicker(ticker)) {
            return rawQuantity.setScale(0, RoundingMode.DOWN);
        }

        BigDecimal lots = rawQuantity.divide(STANDARD_LOT, 0, RoundingMode.DOWN);
        return lots.multiply(STANDARD_LOT);
    }

    private boolean isFractionalTicker(String ticker) {
        return ticker.endsWith("F");
    }

    private OrderActionDTO holdOrder(String ticker, String brokerage) {
        return new OrderActionDTO(
                TradeAction.HOLD,
                ticker,
                BigDecimal.ZERO,
                BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                brokerage
        );
    }

    private String normalizeTicker(String ticker) {
        return ticker.trim().toUpperCase(Locale.ROOT);
    }
}
