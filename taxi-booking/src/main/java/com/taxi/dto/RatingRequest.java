package com.taxi.dto;

/**
 * Request body for POST /rating/submit
 * Submitted by passenger after a completed ride.
 */
public class RatingRequest {

    private Long driverId;
    private Long rideRequestId;
    private Long passengerId;

    // Rating value: 1.0 – 5.0
    private double rating;

    private String comment;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Long getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(Long rideRequestId) { this.rideRequestId = rideRequestId; }

    public Long getPassengerId() { return passengerId; }
    public void setPassengerId(Long passengerId) { this.passengerId = passengerId; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
