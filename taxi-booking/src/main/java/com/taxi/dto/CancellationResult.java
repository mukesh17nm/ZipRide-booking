package com.taxi.dto;

import com.taxi.model.CancellationRecord;
import java.util.Map;

/**
 * Result DTO for ride cancellation with penalty breakdown.
 */
public class CancellationResult {

    private Long rideRequestId;
    private String cancelledBy;
    private double minutesAfterBooking;
    private double penaltyAmount;
    private boolean penaltyWaived;
    private String waiverReason;
    private Map<String, Double> penaltyPolicyTable;  // Map<TimeWindow, PenaltyAmount>
    private String appliedPolicyWindow;
    private CancellationRecord cancellationRecord;
    private String message;
    private String summary;

    public Long getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(Long rideRequestId) { this.rideRequestId = rideRequestId; }

    public String getCancelledBy() { return cancelledBy; }
    public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }

    public double getMinutesAfterBooking() { return minutesAfterBooking; }
    public void setMinutesAfterBooking(double minutesAfterBooking) { this.minutesAfterBooking = minutesAfterBooking; }

    public double getPenaltyAmount() { return penaltyAmount; }
    public void setPenaltyAmount(double penaltyAmount) { this.penaltyAmount = penaltyAmount; }

    public boolean isPenaltyWaived() { return penaltyWaived; }
    public void setPenaltyWaived(boolean penaltyWaived) { this.penaltyWaived = penaltyWaived; }

    public String getWaiverReason() { return waiverReason; }
    public void setWaiverReason(String waiverReason) { this.waiverReason = waiverReason; }

    public Map<String, Double> getPenaltyPolicyTable() { return penaltyPolicyTable; }
    public void setPenaltyPolicyTable(Map<String, Double> penaltyPolicyTable) { this.penaltyPolicyTable = penaltyPolicyTable; }

    public String getAppliedPolicyWindow() { return appliedPolicyWindow; }
    public void setAppliedPolicyWindow(String appliedPolicyWindow) { this.appliedPolicyWindow = appliedPolicyWindow; }

    public CancellationRecord getCancellationRecord() { return cancellationRecord; }
    public void setCancellationRecord(CancellationRecord cancellationRecord) { this.cancellationRecord = cancellationRecord; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
}
