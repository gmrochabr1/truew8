package com.truew8.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.truew8.dto.CreateHoldingRequestDTO;
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
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class PortfolioControllerZeroKnowledgeTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private UserHoldingRepository userHoldingRepository;

    @InjectMocks
    private PortfolioController portfolioController;

    @Captor
    private ArgumentCaptor<UserHolding> holdingCaptor;

    private User user;
    private Portfolio portfolio;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("zk@test.com");

        portfolio = new Portfolio();
        portfolio.setId(UUID.randomUUID());
        portfolio.setUser(user);
        portfolio.setName("Minha Carteira");
        portfolio.setCreatedAt(OffsetDateTime.now());

        authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), "n/a");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    void shouldPersistCiphertextHoldingFieldsWithoutServerComputation() {
        when(portfolioRepository.findById(portfolio.getId())).thenReturn(Optional.of(portfolio));
        when(userHoldingRepository.save(any(UserHolding.class))).thenAnswer(invocation -> {
            UserHolding saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        CreateHoldingRequestDTO request = new CreateHoldingRequestDTO(
                "v1:iv:tickerCipher",
                "v1:iv:brokerageCipher",
                "v1:iv:quantityCipher",
                "v1:iv:averagePriceCipher",
                Market.B3,
                AssetType.STOCK
        );

        ResponseEntity<UserHoldingDTO> response = portfolioController.addHoldingToPortfolio(
                portfolio.getId(),
                request,
                authentication
        );

        assertNotNull(response.getBody());
        UserHoldingDTO body = response.getBody();
        assertEquals("v1:iv:tickerCipher", body.ticker());
        assertEquals("v1:iv:brokerageCipher", body.brokerage());
        assertEquals("v1:iv:quantityCipher", body.quantity());
        assertEquals("v1:iv:averagePriceCipher", body.averagePrice());
    }

    @Test
    void shouldReturnZeroTotalInvestedInPortfolioSummaryUnderZeroKnowledge() {
        when(portfolioRepository.findByUserId(user.getId())).thenReturn(List.of(portfolio));
        when(userHoldingRepository.findByPortfolioId(portfolio.getId())).thenReturn(List.of(
                createHolding(portfolio, "cipher-q1", "cipher-p1"),
                createHolding(portfolio, "cipher-q2", "cipher-p2")
        ));

        ResponseEntity<List<PortfolioSummaryDTO>> response = portfolioController.portfolios(authentication);

        assertEquals(1, response.getBody().size());
        PortfolioSummaryDTO summary = response.getBody().get(0);
        assertEquals(2, summary.holdingsCount());
        assertEquals(0, BigDecimal.ZERO.compareTo(summary.totalInvested()));
    }

    private UserHolding createHolding(Portfolio owner, String quantity, String averagePrice) {
        UserHolding holding = new UserHolding();
        holding.setId(UUID.randomUUID());
        holding.setPortfolio(owner);
        holding.setTicker("cipher-ticker");
        holding.setBrokerage("cipher-brokerage");
        holding.setMarket(Market.B3);
        holding.setAssetType(AssetType.STOCK);
        holding.setQuantity(quantity);
        holding.setAveragePrice(averagePrice);
        holding.setIsLocked(false);
        return holding;
    }
}
