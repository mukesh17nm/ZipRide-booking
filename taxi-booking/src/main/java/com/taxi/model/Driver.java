package com.taxi.model;

import jakarta.persistence.*;

/**
 * Represents a taxi driver in the system.
 * status: AVAILABLE | BUSY | OFFLINE
 * vehicleType: MINI | SEDAN | SUV | AUTO
 */
@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "driver_name", nullable = false)
    private String driverName;

    @Column(name = "contact_number", nullable = false)
    private String contactNumber;

    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType;       // MINI, SEDAN, SUV, AUTO

    @Column(name = "vehicle_number", nullable = false)
    private String vehicleNumber;

    // Operational status — drives Feature 1 (driver matching)
    @Column(name = "status", nullable = false)
    private String status;            // AVAILABLE, BUSY, OFFLINE

    // Current GPS coordinates — used for distance computation in Feature 1
    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    // Zone identifier — used for surge pricing in Feature 2
    @Column(name = "zone", nullable = false)
    private String zone;

    // Rolling rating fields — updated by Feature 4
    @Column(name = "rolling_average_rating", nullable = false)
    private double rollingAverageRating = 0.0;

    @Column(name = "total_rides_rated", nullable = false)
    private int totalRidesRated = 0;

    // Warning flag — set when rolling avg drops below threshold in Feature 4
    @Column(name = "warning_flagged", nullable = false)
    private boolean warningFlagged = false;

    @Column(name = "warning_reason", length = 500)
    private String warningReason;

    // Incentive tracking — used by Feature 4
    @Column(name = "trips_today", nullable = false)
    private int tripsToday = 0;

    @Column(name = "trips_this_week", nullable = false)
    private int tripsThisWeek = 0;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public double getRollingAverageRating() { return rollingAverageRating; }
    public void setRollingAverageRating(double rollingAverageRating) {
        this.rollingAverageRating = rollingAverageRating;
    }

    public int getTotalRidesRated() { return totalRidesRated; }
    public void setTotalRidesRated(int totalRidesRated) { this.totalRidesRated = totalRidesRated; }

    public boolean isWarningFlagged() { return warningFlagged; }
    public void setWarningFlagged(boolean warningFlagged) { this.warningFlagged = warningFlagged; }

    public String getWarningReason() { return warningReason; }
    public void setWarningReason(String warningReason) { this.warningReason = warningReason; }

    public int getTripsToday() { return tripsToday; }
    public void setTripsToday(int tripsToday) { this.tripsToday = tripsToday; }

    public int getTripsThisWeek() { return tripsThisWeek; }
    public void setTripsThisWeek(int tripsThisWeek) { this.tripsThisWeek = tripsThisWeek; }
}
