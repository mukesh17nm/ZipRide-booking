package com.taxi.repository;

import com.taxi.model.DriverRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRatingRepository extends JpaRepository<DriverRating, Long> {

    // Feature 4: fetch all ratings for a driver — used for rolling average
    List<DriverRating> findByDriverIdOrderByRatedAtDesc(Long driverId);

    // Feature 4: fetch latest N ratings
    List<DriverRating> findTop10ByDriverIdOrderByRatedAtDesc(Long driverId);

    // Fetch all ratings for a specific ride
    List<DriverRating> findByRideRequestId(Long rideRequestId);
}
