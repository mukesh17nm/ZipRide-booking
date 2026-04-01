package com.taxi.dto;

/**
 * Request body for POST /fare/surge
 * Supplies zone and base fare; the service computes supply-demand ratio and surge multiplier.
 */
public class SurgePriceRequest {

    private String zone;
    private String vehicleType;
    private double baseFare;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public double getBaseFare() { return baseFare; }
    public void setBaseFare(double baseFare) { this.baseFare = baseFare; }
}
