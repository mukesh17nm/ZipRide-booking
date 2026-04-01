package com.taxi.dto;

import com.taxi.model.Driver;

import java.util.List;
import java.util.Map;

/**
 * Response body for POST /driver-match/find
 *
 * Key collections demonstrated:
 *  - List<Driver>               : top N nearest drivers sorted by proximity
 *  - Map<Long, Double>          : driverId → estimated distance (km) to pickup
 *  - Map<Long, String>          : driverId → offer expiry timestamp (ISO string)
 */
public class DriverMatchResult {

    private Long rideRequestId;

    // Top N nearest available drivers sorted by distance (ascending)
    private List<Driver> nearestDrivers;

    // Map<DriverId, EstimatedDistanceKm> — computed via Haversine formula
    private Map<Long, Double> driverDistances;

    // Map<DriverId, OfferExpiry> — pending offers with expiry timestamps
    // Simulates: if driver does not accept within window, next driver is tried
    private Map<Long, String> offerExpiryMap;

    private int totalAvailableDrivers;
    private String message;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(Long rideRequestId) { this.rideRequestId = rideRequestId; }

    public List<Driver> getNearestDrivers() { return nearestDrivers; }
    public void setNearestDrivers(List<Driver> nearestDrivers) { this.nearestDrivers = nearestDrivers; }

    public Map<Long, Double> getDriverDistances() { return driverDistances; }
    public void setDriverDistances(Map<Long, Double> driverDistances) { this.driverDistances = driverDistances; }

    public Map<Long, String> getOfferExpiryMap() { return offerExpiryMap; }
    public void setOfferExpiryMap(Map<Long, String> offerExpiryMap) { this.offerExpiryMap = offerExpiryMap; }

    public int getTotalAvailableDrivers() { return totalAvailableDrivers; }
    public void setTotalAvailableDrivers(int totalAvailableDrivers) {
        this.totalAvailableDrivers = totalAvailableDrivers;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
