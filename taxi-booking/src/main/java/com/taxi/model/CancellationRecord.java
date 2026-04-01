package com.taxi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Records ride cancellations and applied penalties.
 * cancelledBy: PASSENGER | DRIVER
 */
@Entity
@Table(name = "cancellation_records")
public class CancellationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ride_request_id", nullable = false)
    private Long rideRequestId;

    @Column(name = "cancelled_by", nullable = false)
    private String cancelledBy;   // PASSENGER or DRIVER

    @Column(name = "canceller_id", nullable = false)
    private Long cancellerId;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "minutes_after_booking", nullable = false)
    private double minutesAfterBooking;

    @Column(name = "penalty_amount", nullable = false)
    private double penaltyAmount;

    @Column(name = "penalty_waived", nullable = false)
    private boolean penaltyWaived = false;

    @Column(name = "waiver_reason")
    private String waiverReason;

    @Column(name = "cancelled_at", nullable = false)
    private LocalDateTime cancelledAt;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(Long rideRequestId) { this.rideRequestId = rideRequestId; }

    public String getCancelledBy() { return cancelledBy; }
    public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }

    public Long getCancellerId() { return cancellerId; }
    public void setCancellerId(Long cancellerId) { this.cancellerId = cancellerId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public double getMinutesAfterBooking() { return minutesAfterBooking; }
    public void setMinutesAfterBooking(double minutesAfterBooking) { this.minutesAfterBooking = minutesAfterBooking; }

    public double getPenaltyAmount() { return penaltyAmount; }
    public void setPenaltyAmount(double penaltyAmount) { this.penaltyAmount = penaltyAmount; }

    public boolean isPenaltyWaived() { return penaltyWaived; }
    public void setPenaltyWaived(boolean penaltyWaived) { this.penaltyWaived = penaltyWaived; }

    public String getWaiverReason() { return waiverReason; }
    public void setWaiverReason(String waiverReason) { this.waiverReason = waiverReason; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
