package com.taxi.repository;

import com.taxi.model.RideStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideStopRepository extends JpaRepository<RideStop, Long> {

    // Feature 3: fetch all stops for a ride ordered by stop_order
    List<RideStop> findByRideRequestIdOrderByStopOrderAsc(Long rideRequestId);
}
