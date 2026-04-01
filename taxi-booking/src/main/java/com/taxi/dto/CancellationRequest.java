package com.taxi.dto;

/**
 * Request DTO for ride cancellation.
 */
public class CancellationRequest {

    private Long rideRequestId;
    private String cancelledBy;   // PASSENGER or DRIVER
    private Long cancellerId;
    private String reason;

    public Long getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(Long rideRequestId) { this.rideRequestId = rideRequestId; }

    public String getCancelledBy() { return cancelledBy; }
    public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }

    public Long getCancellerId() { return cancellerId; }
    public void setCancellerId(Long cancellerId) { this.cancellerId = cancellerId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
