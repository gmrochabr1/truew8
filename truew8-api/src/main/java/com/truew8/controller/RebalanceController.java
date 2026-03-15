package com.truew8.controller;

import com.truew8.dto.RebalanceRequestDTO;
import com.truew8.dto.RebalanceResponseDTO;
import com.truew8.service.RebalancingEngine;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rebalance")
public class RebalanceController {

    private final RebalancingEngine rebalancingEngine;

    public RebalanceController(RebalancingEngine rebalancingEngine) {
        this.rebalancingEngine = rebalancingEngine;
    }

    @PostMapping
    public ResponseEntity<RebalanceResponseDTO> rebalance(@Valid @RequestBody RebalanceRequestDTO request) {
        return ResponseEntity.ok(rebalancingEngine.rebalance(request));
    }
}
