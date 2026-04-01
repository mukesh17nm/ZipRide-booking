package com.taxi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * A ride request placed by a passenger.
 * status: PENDING | MATCHED | ACTIVE | COMPLETED | CANCELLED
 *
 * Used in Feature 1 (driver matching) and Feature 2 (surge — active requests per zone).
 */
@Entity
@Table(name = "ride_requests")
public class RideRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "passenger_id", nullable = false)
    private Long passengerId;

    // Assigned driver — set after matching in Feature 1
    @Column(name = "driver_id")
    private Long driverId;

    // Pickup coordinates — used for distance computation in Feature 1
    @Column(name = "pickup_lat", nullable = false)
    private double pickupLat;

    @Column(name = "pickup_lng", nullable = false)
    private double pickupLng;

    // Human-readable pickup place name
    @Column(name = "pickup_name", length = 500)
    private String pickupName;

    // Drop coordinates
    @Column(name = "drop_lat", nullable = false)
    private double dropLat;

    @Column(name = "drop_lng", nullable = false)
    private double dropLng;

    // Human-readable drop place name
    @Column(name = "drop_name", length = 500)
    private String dropName;

    // Passenger name (denormalized for quick display)
    @Column(name = "passenger_name", length = 200)
    private String passengerName;

    // Zone — used for surge pricing in Feature 2
    @Column(name = "zone", nullable = false)
    private String zone;

    // Vehicle preference — used in fare calculation Feature 3
    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "request_time", nullable = false)
    private LocalDateTime requestTime;

    // Fare fields — populated after fare calculation
    @Column(name = "estimated_fare")
    private Double estimatedFare;

    @Column(name = "final_fare")
    private Double finalFare;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPassengerId() { return passengerId; }
    public void setPassengerId(Long passengerId) { this.passengerId = passengerId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public double getPickupLat() { return pickupLat; }
    public void setPickupLat(double pickupLat) { this.pickupLat = pickupLat; }

    public double getPickupLng() { return pickupLng; }
    public void setPickupLng(double pickupLng) { this.pickupLng = pickupLng; }

    public String getPickupName() { return pickupName; }
    public void setPickupName(String pickupName) { this.pickupName = pickupName; }

    public double getDropLat() { return dropLat; }
    public void setDropLat(double dropLat) { this.dropLat = dropLat; }

    public double getDropLng() { return dropLng; }
    public void setDropLng(double dropLng) { this.dropLng = dropLng; }

    public String getDropName() { return dropName; }
    public void setDropName(String dropName) { this.dropName = dropName; }

    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getRequestTime() { return requestTime; }
    public void setRequestTime(LocalDateTime requestTime) { this.requestTime = requestTime; }

    public Double getEstimatedFare() { return estimatedFare; }
    public void setEstimatedFare(Double estimatedFare) { this.estimatedFare = estimatedFare; }

    public Double getFinalFare() { return finalFare; }
    public void setFinalFare(Double finalFare) { this.finalFare = finalFare; }
}
