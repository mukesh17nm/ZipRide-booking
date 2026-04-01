package com.taxi.controller;

import com.taxi.dto.PromoApplyRequest;
import com.taxi.dto.PromoApplyResult;
import com.taxi.model.PromoCode;
import com.taxi.service.TaxiFeatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller — Feature 6: Promo Code / Discount Engine
 */
@RestController
@RequestMapping("/api/promo")
@CrossOrigin(origins = "*")
public class PromoController {

    @Autowired
    private TaxiFeatureService taxiFeatureService;

    /**
     * POST /api/promo/create
     * Create a new promo code.
     */
    @PostMapping("/create")
    public ResponseEntity<PromoCode> createPromoCode(@RequestBody PromoCode promoCode) {
        return ResponseEntity.ok(taxiFeatureService.createPromoCode(promoCode));
    }

    /**
     * POST /api/promo/apply
     * Apply a promo code to a ride fare.
     */
    @PostMapping("/apply")
    public ResponseEntity<PromoApplyResult> applyPromoCode(@RequestBody PromoApplyRequest request) {
        return ResponseEntity.ok(taxiFeatureService.applyPromoCode(request));
    }

    /**
     * GET /api/promo/active
     * List all active promo codes.
     */
    @GetMapping("/active")
    public ResponseEntity<List<PromoCode>> getActivePromoCodes() {
        return ResponseEntity.ok(taxiFeatureService.getActivePromoCodes());
    }

    /**
     * GET /api/promo/all
     * List all promo codes (admin).
     */
    @GetMapping("/all")
    public ResponseEntity<List<PromoCode>> getAllPromoCodes() {
        return ResponseEntity.ok(taxiFeatureService.getAllPromoCodes());
    }
}
