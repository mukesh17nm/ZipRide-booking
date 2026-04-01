package com.taxi.dto;

import java.util.Map;

/**
 * Response body for POST /fare/estimate
 *
 * Key collections demonstrated:
 *  - Map<VehicleType, Multiplier>   : vehicle type fare multipliers
 *  - Map<TollPoint, TollAmount>     : toll charges by checkpoint
 */
public class FareEstimateResult {

    private Long rideRequestId;
    private int totalStops;
    private double totalDistanceKm;
    private double estimatedMinutes;

    // Fare breakdown components
    private double baseFare;
    private double distanceFare;           // distanceRate * totalDistanceKm
    private double timeFare;               // timeRate * estimatedMinutes
    private double perStopCharge;          // perStopRate * extraStops
    private double totalTollCharges;       // sum of all toll amounts

    // Map<VehicleType, Multiplier> — shown for transparency
    private Map<String, Double> vehicleMultiplierTable;
    private double vehicleMultiplierApplied;

    private double surgeMultiplierApplied;
    private double nightSurcharge;         // applied if pickupTime is between 22:00-05:00
    private double peakHourSurcharge;      // applied if pickupTime is 07:00-10:00 or 17:00-20:00

    private double totalFare;              // final amount after all multipliers and charges
    private String breakdown;              // human-readable fare breakdown string
    private String message;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(Long rideRequestId) { this.rideRequestId = rideRequestId; }

    public int getTotalStops() { return totalStops; }
    public void setTotalStops(int totalStops) { this.totalStops = totalStops; }

    public double getTotalDistanceKm() { return totalDistanceKm; }
    public void setTotalDistanceKm(double totalDistanceKm) { this.totalDistanceKm = totalDistanceKm; }

    public double getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(double estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }

    public double getBaseFare() { return baseFare; }
    public void setBaseFare(double baseFare) { this.baseFare = baseFare; }

    public double getDistanceFare() { return distanceFare; }
    public void setDistanceFare(double distanceFare) { this.distanceFare = distanceFare; }

    public double getTimeFare() { return timeFare; }
    public void setTimeFare(double timeFare) { this.timeFare = timeFare; }

    public double getPerStopCharge() { return perStopCharge; }
    public void setPerStopCharge(double perStopCharge) { this.perStopCharge = perStopCharge; }

    public double getTotalTollCharges() { return totalTollCharges; }
    public void setTotalTollCharges(double totalTollCharges) { this.totalTollCharges = totalTollCharges; }

    public Map<String, Double> getVehicleMultiplierTable() { return vehicleMultiplierTable; }
    public void setVehicleMultiplierTable(Map<String, Double> vehicleMultiplierTable) {
        this.vehicleMultiplierTable = vehicleMultiplierTable;
    }

    public double getVehicleMultiplierApplied() { return vehicleMultiplierApplied; }
    public void setVehicleMultiplierApplied(double vehicleMultiplierApplied) {
        this.vehicleMultiplierApplied = vehicleMultiplierApplied;
    }

    public double getSurgeMultiplierApplied() { return surgeMultiplierApplied; }
    public void setSurgeMultiplierApplied(double surgeMultiplierApplied) {
        this.surgeMultiplierApplied = surgeMultiplierApplied;
    }

    public double getNightSurcharge() { return nightSurcharge; }
    public void setNightSurcharge(double nightSurcharge) { this.nightSurcharge = nightSurcharge; }

    public double getPeakHourSurcharge() { return peakHourSurcharge; }
    public void setPeakHourSurcharge(double peakHourSurcharge) { this.peakHourSurcharge = peakHourSurcharge; }

    public double getTotalFare() { return totalFare; }
    public void setTotalFare(double totalFare) { this.totalFare = totalFare; }

    public String getBreakdown() { return breakdown; }
    public void setBreakdown(String breakdown) { this.breakdown = breakdown; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
