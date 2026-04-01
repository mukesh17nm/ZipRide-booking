package com.taxi.service;

import com.taxi.dto.*;
import com.taxi.model.*;

import java.util.List;
import java.util.Map;

/**
 * Service interface for all 6 core features:
 *  1. Driver Matching and Nearest Cab Finder
 *  2. Surge Pricing Calculator
 *  3. Ride Fare Calculator with Multiple Stop Support
 *  4. Driver Rating and Incentive Engine
 *  5. Ride Cancellation with Penalty Logic          <- NEW
 *  6. Promo Code / Discount Engine                  <- NEW
 */
public interface TaxiFeatureService {

    // FEATURE 1
    Driver saveDriver(Driver driver);
    List<Driver> getAllDrivers();
    Driver getDriverById(Long driverId);
    Driver updateDriverStatus(Long driverId, String status);
    DriverMatchResult findNearestDrivers(DriverMatchRequest request);
    Map<String, Integer> getAvailableDriverCountByZone();

    // FEATURE 2
    SurgePriceResult computeSurgePrice(SurgePriceRequest request);
    Map<String, Double> getCurrentSurgeByZone();

    // FEATURE 3
    Passenger savePassenger(Passenger passenger);
    List<Passenger> getAllPassengers();
    FareEstimateResult estimateFare(FareEstimateRequest request);
    RideRequest saveRide(RideRequest ride);
    RideRequest getRideById(Long rideId);
    List<RideRequest> getAllRides();

    // FEATURE 4
    RatingAndIncentiveResult submitRatingAndComputeIncentive(RatingRequest request);
    List<DriverRating> getRatingsByDriver(Long driverId);
    List<Driver> getWarnedDrivers();

    // FEATURE 5 - Ride Cancellation with Penalty Logic
    CancellationResult cancelRide(CancellationRequest request);
    List<CancellationRecord> getCancellationHistory(Long cancellerId, String cancelledBy);

    // FEATURE 6 - Promo Code / Discount Engine
    PromoCode createPromoCode(PromoCode promoCode);
    List<PromoCode> getActivePromoCodes();
    PromoApplyResult applyPromoCode(PromoApplyRequest request);
    List<PromoCode> getAllPromoCodes();
}
