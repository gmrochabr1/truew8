package com.truew8.controller;

import com.truew8.dto.RebalanceRequestDTO;
import com.truew8.dto.RebalanceResponseDTO;
import com.truew8.dto.AssetDTO;
import com.truew8.entity.User;
import com.truew8.repository.UserHoldingRepository;
import com.truew8.repository.UserRepository;
import com.truew8.service.RebalancingEngine;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rebalance")
public class RebalanceController {

    private final RebalancingEngine rebalancingEngine;
    private final UserRepository userRepository;
    private final UserHoldingRepository userHoldingRepository;

    public RebalanceController(
            RebalancingEngine rebalancingEngine,
            UserRepository userRepository,
            UserHoldingRepository userHoldingRepository
    ) {
        this.rebalancingEngine = rebalancingEngine;
        this.userRepository = userRepository;
        this.userHoldingRepository = userHoldingRepository;
    }

    @PostMapping
    public ResponseEntity<RebalanceResponseDTO> rebalance(
            @Valid @RequestBody RebalanceRequestDTO request,
            Authentication authentication
    ) {
        List<AssetDTO> effectiveHoldings = request.currentHoldings();

        if ((effectiveHoldings == null || effectiveHoldings.isEmpty())
                && authentication != null
                && authentication.isAuthenticated()
                && authentication.getName() != null) {
            User user = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (user != null) {
                effectiveHoldings = userHoldingRepository.findByUserId(user.getId()).stream()
                        .map(holding -> new AssetDTO(
                                holding.getTicker(),
                                holding.getQuantity(),
                                holding.getAveragePrice()
                        ))
                        .toList();
            }
        }

        if (effectiveHoldings == null) {
            effectiveHoldings = List.of();
        }

        RebalanceRequestDTO normalizedRequest = new RebalanceRequestDTO(
                request.newDeposit(),
                effectiveHoldings,
                request.targetPortfolio()
        );

        return ResponseEntity.ok(rebalancingEngine.rebalance(normalizedRequest));
    }
}
