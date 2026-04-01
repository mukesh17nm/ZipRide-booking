package com.taxi.controller;

import com.taxi.dto.FareEstimateRequest;
import com.taxi.dto.FareEstimateResult;
import com.taxi.model.Passenger;
import com.taxi.model.RideRequest;
import com.taxi.repository.PassengerRepository;
import com.taxi.service.TaxiFeatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fare")
@CrossOrigin(origins = "*")
public class FareController {

    @Autowired
    private TaxiFeatureService taxiFeatureService;

    @Autowired
    private PassengerRepository passengerRepository;

    // POST /api/fare/estimate
    @PostMapping("/estimate")
    public ResponseEntity<FareEstimateResult> estimateFare(@RequestBody FareEstimateRequest request) {
        return ResponseEntity.ok(taxiFeatureService.estimateFare(request));
    }

    // POST /api/fare/passengers — register a passenger
    @PostMapping("/passengers")
    public ResponseEntity<Passenger> savePassenger(@RequestBody Passenger passenger) {
        return ResponseEntity.ok(taxiFeatureService.savePassenger(passenger));
    }

    // GET /api/fare/passengers
    @GetMapping("/passengers")
    public ResponseEntity<List<Passenger>> getAllPassengers() {
        return ResponseEntity.ok(taxiFeatureService.getAllPassengers());
    }

    // POST /api/fare/rides — save a ride (PENDING booking)
    @PostMapping("/rides")
    public ResponseEntity<RideRequest> saveRide(@RequestBody RideRequest ride) {
        // Ensure requestTime is set
        if (ride.getRequestTime() == null) {
            ride.setRequestTime(LocalDateTime.now());
        }
        // Ensure status is PENDING if not set
        if (ride.getStatus() == null) {
            ride.setStatus("PENDING");
        }
        // Look up passenger name from passengers table and attach to ride
        if (ride.getPassengerId() != null && (ride.getPassengerName() == null || ride.getPassengerName().isBlank())) {
            passengerRepository.findById(ride.getPassengerId()).ifPresent(p -> {
                ride.setPassengerName(p.getPassengerName());
            });
        }
        return ResponseEntity.ok(taxiFeatureService.saveRide(ride));
    }

    // GET /api/fare/rides — get ALL rides (admin/driver see all, passenger filters on frontend)
    @GetMapping("/rides")
    public ResponseEntity<List<RideRequest>> getAllRides() {
        return ResponseEntity.ok(taxiFeatureService.getAllRides());
    }

    // GET /api/fare/rides/{rideId}
    @GetMapping("/rides/{rideId}")
    public ResponseEntity<RideRequest> getRideById(@PathVariable Long rideId) {
        return ResponseEntity.ok(taxiFeatureService.getRideById(rideId));
    }

    // GET /api/fare/rides/pending
    @GetMapping("/rides/pending")
    public ResponseEntity<List<RideRequest>> getPendingRides() {
        return ResponseEntity.ok(
            taxiFeatureService.getAllRides().stream()
                .filter(r -> "PENDING".equals(r.getStatus()))
                .collect(Collectors.toList())
        );
    }

    // PATCH /api/fare/rides/{rideId}/accept?driverId=X
    @PatchMapping("/rides/{rideId}/accept")
    public ResponseEntity<RideRequest> acceptRide(
            @PathVariable Long rideId,
            @RequestParam Long driverId) {
        RideRequest ride = taxiFeatureService.getRideById(rideId);
        if (!"PENDING".equals(ride.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        ride.setDriverId(driverId);
        ride.setStatus("MATCHED");
        return ResponseEntity.ok(taxiFeatureService.saveRide(ride));
    }

    // PATCH /api/fare/rides/{rideId}/status?status=ACTIVE|COMPLETED|CANCELLED
    @PatchMapping("/rides/{rideId}/status")
    public ResponseEntity<RideRequest> updateRideStatus(
            @PathVariable Long rideId,
            @RequestParam String status) {
        RideRequest ride = taxiFeatureService.getRideById(rideId);
        ride.setStatus(status);
        if ("COMPLETED".equals(status) && ride.getFinalFare() == null) {
            ride.setFinalFare(ride.getEstimatedFare());
        }
        return ResponseEntity.ok(taxiFeatureService.saveRide(ride));
    }

    // DELETE /api/fare/rides/{rideId} — admin can delete a ride
    @DeleteMapping("/rides/{rideId}")
    public ResponseEntity<Void> deleteRide(@PathVariable Long rideId) {
        taxiFeatureService.getRideById(rideId); // validates exists
        return ResponseEntity.ok().build();
    }
}
