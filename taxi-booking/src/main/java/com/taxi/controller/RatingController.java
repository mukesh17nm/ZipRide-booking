package com.taxi.controller;

import com.taxi.dto.RatingAndIncentiveResult;
import com.taxi.dto.RatingRequest;
import com.taxi.model.Driver;
import com.taxi.model.DriverRating;
import com.taxi.service.TaxiFeatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@CrossOrigin(origins = "*")
public class RatingController {

    @Autowired
    private TaxiFeatureService taxiFeatureService;

    @PostMapping("/submit")
    public ResponseEntity<RatingAndIncentiveResult> submitRating(@RequestBody RatingRequest request) {
        return ResponseEntity.ok(taxiFeatureService.submitRatingAndComputeIncentive(request));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<DriverRating>> getRatingsByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(taxiFeatureService.getRatingsByDriver(driverId));
    }

    @GetMapping("/warned-drivers")
    public ResponseEntity<List<Driver>> getWarnedDrivers() {
        return ResponseEntity.ok(taxiFeatureService.getWarnedDrivers());
    }
}
