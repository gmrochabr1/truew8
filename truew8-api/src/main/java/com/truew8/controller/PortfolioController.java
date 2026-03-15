package com.truew8.controller;

import com.truew8.dto.UserHoldingDTO;
import com.truew8.entity.User;
import com.truew8.entity.UserHolding;
import com.truew8.repository.UserHoldingRepository;
import com.truew8.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

    private final UserRepository userRepository;
    private final UserHoldingRepository userHoldingRepository;

    public PortfolioController(UserRepository userRepository, UserHoldingRepository userHoldingRepository) {
        this.userRepository = userRepository;
        this.userHoldingRepository = userHoldingRepository;
    }

    @GetMapping("/holdings")
    public ResponseEntity<List<UserHoldingDTO>> holdings(Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        List<UserHoldingDTO> response = userHoldingRepository.findByPortfolioUserId(userId).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/holdings/{holdingId}/lock")
    @Transactional
    public ResponseEntity<UserHoldingDTO> toggleLock(
            @PathVariable UUID holdingId,
            Authentication authentication
    ) {
        UUID userId = resolveUserId(authentication);
        UserHolding holding = userHoldingRepository.findByIdAndPortfolioUserId(holdingId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Holding not found"));

        holding.setIsLocked(!Boolean.TRUE.equals(holding.getIsLocked()));
        return ResponseEntity.ok(toDto(holding));
    }

    private UUID resolveUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return user.getId();
    }

    private UserHoldingDTO toDto(UserHolding holding) {
        return new UserHoldingDTO(
                holding.getId(),
                holding.getTicker(),
                holding.getBrokerage(),
                holding.getMarket(),
                holding.getAssetType(),
                holding.getQuantity(),
                holding.getAveragePrice(),
                Boolean.TRUE.equals(holding.getIsLocked())
        );
    }
}
