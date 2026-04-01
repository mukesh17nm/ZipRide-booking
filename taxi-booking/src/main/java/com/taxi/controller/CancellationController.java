package com.taxi.controller;

import com.taxi.dto.CancellationRequest;
import com.taxi.dto.CancellationResult;
import com.taxi.model.CancellationRecord;
import com.taxi.service.TaxiFeatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller — Feature 5: Ride Cancellation with Penalty Logic
 */
@RestController
@RequestMapping("/api/cancellation")
@CrossOrigin(origins = "*")
public class CancellationController {

    @Autowired
    private TaxiFeatureService taxiFeatureService;

    /**
     * POST /api/cancellation/cancel
     * Cancel a ride and compute the penalty.
     */
    @PostMapping("/cancel")
    public ResponseEntity<CancellationResult> cancelRide(@RequestBody CancellationRequest request) {
        CancellationResult result = taxiFeatureService.cancelRide(request);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/cancellation/history?cancellerId=1&cancelledBy=PASSENGER
     * Get cancellation history for a passenger or driver.
     */
    @GetMapping("/history")
    public ResponseEntity<List<CancellationRecord>> getCancellationHistory(
            @RequestParam Long cancellerId,
            @RequestParam String cancelledBy) {
        return ResponseEntity.ok(taxiFeatureService.getCancellationHistory(cancellerId, cancelledBy));
    }
}
