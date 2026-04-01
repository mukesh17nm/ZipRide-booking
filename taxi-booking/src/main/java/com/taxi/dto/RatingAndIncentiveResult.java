package com.taxi.dto;

import com.taxi.model.DriverRating;

import java.util.List;
import java.util.Map;

/**
 * Response body for POST /rating/submit
 *
 * Key collections demonstrated:
 *  - List<DriverRating>                : last N ratings fetched for rolling average
 *  - Map<IncentivePeriod, TripTarget>  : daily and weekly trip targets for bonuses
 *  - Map<String, Double>               : incentive awards per period
 */
public class RatingAndIncentiveResult {

    private Long driverId;
    private double newRollingAverageRating;
    private int totalRatingsConsidered;     // last N trips used for rolling average

    // Last N ratings fetched for rolling-average computation
    private List<DriverRating> recentRatings;

    private boolean warningFlagged;
    private String warningReason;

    // Map<IncentivePeriod, TripTarget> — e.g. "DAILY" → 10, "WEEKLY" → 60
    private Map<String, Integer> incentiveTripTargets;

    // Map<IncentivePeriod, BonusAmount> — bonus awarded this period
    private Map<String, Double> incentiveBonusAwarded;

    // Actual trips completed this period
    private Map<String, Integer> actualTripsCompleted;

    private String summary;
    private String message;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public double getNewRollingAverageRating() { return newRollingAverageRating; }
    public void setNewRollingAverageRating(double newRollingAverageRating) {
        this.newRollingAverageRating = newRollingAverageRating;
    }

    public int getTotalRatingsConsidered() { return totalRatingsConsidered; }
    public void setTotalRatingsConsidered(int totalRatingsConsidered) {
        this.totalRatingsConsidered = totalRatingsConsidered;
    }

    public List<DriverRating> getRecentRatings() { return recentRatings; }
    public void setRecentRatings(List<DriverRating> recentRatings) {
        this.recentRatings = recentRatings;
    }

    public boolean isWarningFlagged() { return warningFlagged; }
    public void setWarningFlagged(boolean warningFlagged) { this.warningFlagged = warningFlagged; }

    public String getWarningReason() { return warningReason; }
    public void setWarningReason(String warningReason) { this.warningReason = warningReason; }

    public Map<String, Integer> getIncentiveTripTargets() { return incentiveTripTargets; }
    public void setIncentiveTripTargets(Map<String, Integer> incentiveTripTargets) {
        this.incentiveTripTargets = incentiveTripTargets;
    }

    public Map<String, Double> getIncentiveBonusAwarded() { return incentiveBonusAwarded; }
    public void setIncentiveBonusAwarded(Map<String, Double> incentiveBonusAwarded) {
        this.incentiveBonusAwarded = incentiveBonusAwarded;
    }

    public Map<String, Integer> getActualTripsCompleted() { return actualTripsCompleted; }
    public void setActualTripsCompleted(Map<String, Integer> actualTripsCompleted) {
        this.actualTripsCompleted = actualTripsCompleted;
    }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
