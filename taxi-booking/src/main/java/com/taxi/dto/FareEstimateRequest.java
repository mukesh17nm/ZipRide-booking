package com.taxi.dto;

import com.taxi.model.RideStop;

import java.util.List;
import java.util.Map;

/**
 * Request body for POST /fare/estimate
 * Supports multi-stop rides, toll points, vehicle type multiplier, and time-based surcharges.
 */
public class FareEstimateRequest {

    private Long rideRequestId;

    // List<Stop> — multi-stop support; includes pickup as index 0 and drop as last element
    private List<RideStop> stops;

    // Vehicle type — used to look up Map<VehicleType, Multiplier>
    private String vehicleType;

    // Pickup time as ISO string — used for night/peak-hour surcharge check
    // e.g. "2024-03-15T22:30:00"
    private String pickupTime;

    // Map<TollPointName, TollAmount> — toll points the route passes through
    // e.g. { "Highway_NH48": 45.0, "CityToll_Ring": 20.0 }
    private Map<String, Double> tollCharges;

    // Surge multiplier from Feature 2 — applied to final fare
    private double surgeMultiplier = 1.0;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(Long rideRequestId) { this.rideRequestId = rideRequestId; }

    public List<RideStop> getStops() { return stops; }
    public void setStops(List<RideStop> stops) { this.stops = stops; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getPickupTime() { return pickupTime; }
    public void setPickupTime(String pickupTime) { this.pickupTime = pickupTime; }

    public Map<String, Double> getTollCharges() { return tollCharges; }
    public void setTollCharges(Map<String, Double> tollCharges) { this.tollCharges = tollCharges; }

    public double getSurgeMultiplier() { return surgeMultiplier; }
    public void setSurgeMultiplier(double surgeMultiplier) { this.surgeMultiplier = surgeMultiplier; }
}
