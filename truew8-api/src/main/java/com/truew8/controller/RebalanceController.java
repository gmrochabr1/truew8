package com.truew8.controller;

import com.truew8.dto.RebalanceRequestDTO;
import com.truew8.dto.RebalanceResponseDTO;
import com.truew8.service.RebalancingEngine;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rebalance")
public class RebalanceController {

    private final RebalancingEngine rebalancingEngine;

    public RebalanceController(
            RebalancingEngine rebalancingEngine
    ) {
        this.rebalancingEngine = rebalancingEngine;
    }

    @PostMapping
    public ResponseEntity<RebalanceResponseDTO> rebalance(
            @Valid @RequestBody RebalanceRequestDTO request
    ) {
        List<com.truew8.dto.AssetDTO> effectiveHoldings = request.currentHoldings();

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
