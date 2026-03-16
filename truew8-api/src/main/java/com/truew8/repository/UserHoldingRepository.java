package com.truew8.repository;

import com.truew8.entity.UserHolding;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserHoldingRepository extends JpaRepository<UserHolding, UUID> {

    List<UserHolding> findByPortfolioId(UUID portfolioId);

    List<UserHolding> findByPortfolioUserId(UUID userId);

    Optional<UserHolding> findByIdAndPortfolioUserId(UUID id, UUID userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from UserHolding h where h.portfolio.id = :portfolioId")
    int deleteAllByPortfolioId(@Param("portfolioId") UUID portfolioId);
}
