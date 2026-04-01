package com.taxi.dto;

/**
 * Request body for POST /driver-match/find
 * Carries pickup coordinates, zone, vehicle preference, and how many top drivers to return.
 */
public class DriverMatchRequest {

    private Long passengerId;

    // Pickup GPS coordinates — used to compute distance to each available driver
    private double pickupLat;
    private double pickupLng;

    // Drop GPS coordinates
    private double dropLat;
    private double dropLng;

    // Zone used for surge check
    private String zone;

    // Vehicle type preference: MINI, SEDAN, SUV, AUTO
    private String vehicleType;

    // How many top nearest drivers to select (default 3)
    private int topN = 3;

    // Offer expiry window in seconds (default 30 seconds)
    private int offerExpirySeconds = 30;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getPassengerId() { return passengerId; }
    public void setPassengerId(Long passengerId) { this.passengerId = passengerId; }

    public double getPickupLat() { return pickupLat; }
    public void setPickupLat(double pickupLat) { this.pickupLat = pickupLat; }

    public double getPickupLng() { return pickupLng; }
    public void setPickupLng(double pickupLng) { this.pickupLng = pickupLng; }

    public double getDropLat() { return dropLat; }
    public void setDropLat(double dropLat) { this.dropLat = dropLat; }

    public double getDropLng() { return dropLng; }
    public void setDropLng(double dropLng) { this.dropLng = dropLng; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public int getTopN() { return topN; }
    public void setTopN(int topN) { this.topN = topN; }

    public int getOfferExpirySeconds() { return offerExpirySeconds; }
    public void setOfferExpirySeconds(int offerExpirySeconds) { this.offerExpirySeconds = offerExpirySeconds; }
}
