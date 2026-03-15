package com.truew8.repository;

import com.truew8.entity.UserHolding;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserHoldingRepository extends JpaRepository<UserHolding, UUID> {

    List<UserHolding> findByUserId(UUID userId);

    Optional<UserHolding> findByIdAndUserId(UUID id, UUID userId);
}
