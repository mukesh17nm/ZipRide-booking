package com.taxi.dto;

import java.util.Map;

/**
 * Response body for POST /fare/surge
 *
 * Key collections demonstrated:
 *  - Map<String, Double>         : RatioRange → SurgeMultiplier (e.g. "0.0-0.5" → 2.0)
 *  - Map<String, Object>         : zone surge config breakdown
 */
public class SurgePriceResult {

    private String zone;
    private int activeRideRequests;
    private int availableDrivers;
    private double supplyDemandRatio;    // availableDrivers / activeRequests

    // Surge multiplier resolved from Map<RatioRange, SurgeMultiplier>
    private double surgeMultiplier;

    // Map<RatioRange, SurgeMultiplier> — full table shown in response for transparency
    private Map<String, Double> surgeMultiplierTable;

    private double originalFare;
    private double surgedFare;          // originalFare * surgeMultiplier
    private boolean capApplied;         // true if regulatory cap was enforced
    private double regulatoryMaxMultiplier;

    private String breakdown;
    private String message;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public int getActiveRideRequests() { return activeRideRequests; }
    public void setActiveRideRequests(int activeRideRequests) {
        this.activeRideRequests = activeRideRequests;
    }

    public int getAvailableDrivers() { return availableDrivers; }
    public void setAvailableDrivers(int availableDrivers) { this.availableDrivers = availableDrivers; }

    public double getSupplyDemandRatio() { return supplyDemandRatio; }
    public void setSupplyDemandRatio(double supplyDemandRatio) {
        this.supplyDemandRatio = supplyDemandRatio;
    }

    public double getSurgeMultiplier() { return surgeMultiplier; }
    public void setSurgeMultiplier(double surgeMultiplier) { this.surgeMultiplier = surgeMultiplier; }

    public Map<String, Double> getSurgeMultiplierTable() { return surgeMultiplierTable; }
    public void setSurgeMultiplierTable(Map<String, Double> surgeMultiplierTable) {
        this.surgeMultiplierTable = surgeMultiplierTable;
    }

    public double getOriginalFare() { return originalFare; }
    public void setOriginalFare(double originalFare) { this.originalFare = originalFare; }

    public double getSurgedFare() { return surgedFare; }
    public void setSurgedFare(double surgedFare) { this.surgedFare = surgedFare; }

    public boolean isCapApplied() { return capApplied; }
    public void setCapApplied(boolean capApplied) { this.capApplied = capApplied; }

    public double getRegulatoryMaxMultiplier() { return regulatoryMaxMultiplier; }
    public void setRegulatoryMaxMultiplier(double regulatoryMaxMultiplier) {
        this.regulatoryMaxMultiplier = regulatoryMaxMultiplier;
    }

    public String getBreakdown() { return breakdown; }
    public void setBreakdown(String breakdown) { this.breakdown = breakdown; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
