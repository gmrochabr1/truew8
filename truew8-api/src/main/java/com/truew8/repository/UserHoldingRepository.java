package com.truew8.repository;

import com.truew8.entity.UserHolding;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserHoldingRepository extends JpaRepository<UserHolding, UUID> {

    List<UserHolding> findByPortfolioId(UUID portfolioId);

    List<UserHolding> findByPortfolioUserId(UUID userId);

    Optional<UserHolding> findByPortfolioIdAndTickerAndBrokerage(UUID portfolioId, String ticker, String brokerage);

    Optional<UserHolding> findByIdAndPortfolioUserId(UUID id, UUID userId);
}
