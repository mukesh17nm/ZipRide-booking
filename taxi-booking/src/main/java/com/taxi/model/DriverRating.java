package com.taxi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Individual rating entry submitted by a passenger after a ride.
 * List<DriverRating> is fetched per driver for rolling average in Feature 4.
 */
@Entity
@Table(name = "driver_ratings")
public class DriverRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "driver_id", nullable = false)
    private Long driverId;

    @Column(name = "ride_request_id", nullable = false)
    private Long rideRequestId;

    @Column(name = "passenger_id", nullable = false)
    private Long passengerId;

    // Rating value on 1.0–5.0 scale
    @Column(name = "rating", nullable = false)
    private double rating;

    @Column(name = "comment", length = 500)
    private String comment;

    @Column(name = "rated_at", nullable = false)
    private LocalDateTime ratedAt;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public LocalDateTime getRatedAt() { return ratedAt; }
    public void setRatedAt(LocalDateTime ratedAt) { this.ratedAt = ratedAt; }
}
