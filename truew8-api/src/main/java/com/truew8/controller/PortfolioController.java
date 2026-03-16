package com.truew8.controller;

import com.truew8.dto.CreateHoldingRequestDTO;
import com.truew8.dto.CreatePortfolioRequestDTO;
import com.truew8.dto.PortfolioSummaryDTO;
import com.truew8.dto.UserHoldingDTO;
import com.truew8.entity.AssetType;
import com.truew8.entity.Market;
import com.truew8.entity.Portfolio;
import com.truew8.entity.User;
import com.truew8.entity.UserHolding;
import com.truew8.repository.PortfolioRepository;
import com.truew8.repository.UserHoldingRepository;
import com.truew8.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

    private static final String DEFAULT_PORTFOLIO_NAME = "Minha Carteira";

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final UserHoldingRepository userHoldingRepository;

    public PortfolioController(
            UserRepository userRepository,
            PortfolioRepository portfolioRepository,
            UserHoldingRepository userHoldingRepository
    ) {
        this.userRepository = userRepository;
        this.portfolioRepository = portfolioRepository;
        this.userHoldingRepository = userHoldingRepository;
    }

    @GetMapping
    public ResponseEntity<List<PortfolioSummaryDTO>> portfolios(Authentication authentication) {
        User user = resolveUser(authentication);
        List<PortfolioSummaryDTO> response = portfolioRepository.findByUserId(user.getId()).stream()
                .sorted(Comparator.comparing(Portfolio::getCreatedAt))
                .map(this::toPortfolioSummary)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<PortfolioSummaryDTO> createPortfolio(
            @RequestBody(required = false) CreatePortfolioRequestDTO request,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        String requestedName = request != null ? request.name() : null;
        String requestedDescription = request != null ? request.description() : null;

        String name = requestedName != null && !requestedName.isBlank()
                ? requestedName.trim()
                : buildDefaultPortfolioName(user.getId());

        Portfolio portfolio = new Portfolio();
        portfolio.setUser(user);
        portfolio.setName(name);
        portfolio.setDescription(requestedDescription != null && !requestedDescription.isBlank() ? requestedDescription.trim() : null);

        Portfolio saved = portfolioRepository.save(portfolio);
        return ResponseEntity.status(HttpStatus.CREATED).body(toPortfolioSummary(saved));
    }

    @GetMapping("/{portfolioId}/holdings")
    public ResponseEntity<List<UserHoldingDTO>> holdingsByPortfolio(
            @PathVariable UUID portfolioId,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found"));

        if (!portfolio.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found");
        }

        List<UserHoldingDTO> response = userHoldingRepository.findByPortfolioId(portfolioId).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{portfolioId}/holdings")
    @Transactional
    public ResponseEntity<UserHoldingDTO> addHoldingToPortfolio(
            @PathVariable UUID portfolioId,
            @Valid @RequestBody CreateHoldingRequestDTO request,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found"));

        if (!portfolio.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found");
        }

        UserHolding holding = new UserHolding();
        holding.setPortfolio(portfolio);
        holding.setTicker(request.ticker().trim());
        holding.setBrokerage(request.brokerage().trim());
        holding.setMarket(request.market() != null ? request.market() : Market.B3);
        holding.setAssetType(request.assetType() != null ? request.assetType() : AssetType.STOCK);
        holding.setQuantity(request.quantity().trim());
        holding.setAveragePrice(request.averagePrice().trim());
        holding.setIsLocked(false);

        UserHolding saved = userHoldingRepository.save(holding);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @GetMapping("/holdings")
    public ResponseEntity<List<UserHoldingDTO>> holdings(Authentication authentication) {
        User user = resolveUser(authentication);
        UUID userId = user.getId();
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
            UUID userId = resolveUser(authentication).getId();
        UserHolding holding = userHoldingRepository.findByIdAndPortfolioUserId(holdingId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Holding not found"));

        holding.setIsLocked(!Boolean.TRUE.equals(holding.getIsLocked()));
        return ResponseEntity.ok(toDto(holding));
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private PortfolioSummaryDTO toPortfolioSummary(Portfolio portfolio) {
        List<UserHolding> holdings = userHoldingRepository.findByPortfolioId(portfolio.getId());

        return new PortfolioSummaryDTO(
                portfolio.getId(),
                portfolio.getName(),
                portfolio.getDescription(),
                holdings.size(),
            java.math.BigDecimal.ZERO
        );
    }

    private String buildDefaultPortfolioName(UUID userId) {
        long count = portfolioRepository.findByUserId(userId).size();
        if (count == 0) {
            return DEFAULT_PORTFOLIO_NAME;
        }
        return DEFAULT_PORTFOLIO_NAME + " " + (count + 1);
    }

    private UserHoldingDTO toDto(UserHolding holding) {
        return new UserHoldingDTO(
                holding.getId(),
                holding.getPortfolio().getId(),
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
