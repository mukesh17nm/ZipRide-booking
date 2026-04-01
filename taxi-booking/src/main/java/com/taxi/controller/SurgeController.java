package com.taxi.controller;

import com.taxi.dto.SurgePriceRequest;
import com.taxi.dto.SurgePriceResult;
import com.taxi.service.TaxiFeatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/surge")
@CrossOrigin(origins = "*")
public class SurgeController {

    @Autowired
    private TaxiFeatureService taxiFeatureService;

    @PostMapping("/compute")
    public ResponseEntity<SurgePriceResult> computeSurgePrice(@RequestBody SurgePriceRequest request) {
        return ResponseEntity.ok(taxiFeatureService.computeSurgePrice(request));
    }

    @GetMapping("/by-zone")
    public ResponseEntity<Map<String, Double>> getCurrentSurgeByZone() {
        return ResponseEntity.ok(taxiFeatureService.getCurrentSurgeByZone());
    }
}
