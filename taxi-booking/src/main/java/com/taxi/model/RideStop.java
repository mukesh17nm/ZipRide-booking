package com.taxi.model;

import jakarta.persistence.*;

/**
 * An intermediate stop for a multi-stop ride — used in Feature 3 (fare calculation).
 * List<RideStop> for a ride is fetched and distances are summed.
 */
@Entity
@Table(name = "ride_stops")
public class RideStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ride_request_id", nullable = false)
    private Long rideRequestId;

    // Order of stop within the ride (1, 2, 3 ...)
    @Column(name = "stop_order", nullable = false)
    private int stopOrder;

    @Column(name = "stop_name")
    private String stopName;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(Long rideRequestId) { this.rideRequestId = rideRequestId; }

    public int getStopOrder() { return stopOrder; }
    public void setStopOrder(int stopOrder) { this.stopOrder = stopOrder; }

    public String getStopName() { return stopName; }
    public void setStopName(String stopName) { this.stopName = stopName; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
}
