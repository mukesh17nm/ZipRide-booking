package com.taxi.repository;

import com.taxi.model.RideRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideRequestRepository extends JpaRepository<RideRequest, Long> {

    // Feature 2: count active requests in a zone for surge pricing
    List<RideRequest> findByZoneAndStatus(String zone, String status);

    // Feature 2: count all active requests regardless of zone
    List<RideRequest> findByStatus(String status);

    // Fetch all requests for a specific passenger
    List<RideRequest> findByPassengerId(Long passengerId);
}
