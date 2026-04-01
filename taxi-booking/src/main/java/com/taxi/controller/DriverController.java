package com.taxi.controller;

import com.taxi.dto.DriverMatchRequest;
import com.taxi.dto.DriverMatchResult;
import com.taxi.model.AppUser;
import com.taxi.model.Driver;
import com.taxi.repository.AppUserRepository;
import com.taxi.service.TaxiFeatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private TaxiFeatureService taxiFeatureService;

    @Autowired
    private AppUserRepository appUserRepository;

    // POST /api/drivers — register a new driver (ADMIN only)
    @PostMapping
    public ResponseEntity<Driver> saveDriver(@RequestBody Driver driver) {
        return ResponseEntity.ok(taxiFeatureService.saveDriver(driver));
    }

    // GET /api/drivers — get all drivers
    @GetMapping
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(taxiFeatureService.getAllDrivers());
    }

    // GET /api/drivers/{driverId} — get a driver by id
    @GetMapping("/{driverId}")
    public ResponseEntity<Driver> getDriverById(@PathVariable Long driverId) {
        return ResponseEntity.ok(taxiFeatureService.getDriverById(driverId));
    }

    // PATCH /api/drivers/{driverId}/status?status=AVAILABLE
    @PatchMapping("/{driverId}/status")
    public ResponseEntity<Driver> updateDriverStatus(
            @PathVariable Long driverId,
            @RequestParam String status) {
        return ResponseEntity.ok(taxiFeatureService.updateDriverStatus(driverId, status));
    }

    // POST /api/drivers/match — find top N nearest available drivers
    @PostMapping("/match")
    public ResponseEntity<DriverMatchResult> findNearestDrivers(@RequestBody DriverMatchRequest request) {
        return ResponseEntity.ok(taxiFeatureService.findNearestDrivers(request));
    }

    // POST /api/drivers/find-nearest — alias for frontend compatibility
    @PostMapping("/find-nearest")
    public ResponseEntity<DriverMatchResult> findNearestDriversAlias(@RequestBody DriverMatchRequest request) {
        return ResponseEntity.ok(taxiFeatureService.findNearestDrivers(request));
    }

    // GET /api/drivers/available-by-zone
    @GetMapping("/available-by-zone")
    public ResponseEntity<Map<String, Integer>> getAvailableDriverCountByZone() {
        return ResponseEntity.ok(taxiFeatureService.getAvailableDriverCountByZone());
    }

    // GET /api/drivers/by-zone — alias
    @GetMapping("/by-zone")
    public ResponseEntity<Map<String, Integer>> getByZone() {
        return ResponseEntity.ok(taxiFeatureService.getAvailableDriverCountByZone());
    }

    // GET /api/drivers/users — get all users (admin)
    @GetMapping("/users")
    public ResponseEntity<List<AppUser>> getAllUsers() {
        return ResponseEntity.ok(appUserRepository.findAll());
    }
}
