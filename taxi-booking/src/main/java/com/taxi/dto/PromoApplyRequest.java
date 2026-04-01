package com.taxi.dto;

/**
 * Request DTO for applying a promo code to a ride fare.
 */
public class PromoApplyRequest {

    private String promoCode;
    private Long passengerId;
    private Long rideRequestId;
    private double originalFare;

    public String getPromoCode() { return promoCode; }
    public void setPromoCode(String promoCode) { this.promoCode = promoCode; }

    public Long getPassengerId() { return passengerId; }
    public void setPassengerId(Long passengerId) { this.passengerId = passengerId; }

    public Long getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(Long rideRequestId) { this.rideRequestId = rideRequestId; }

    public double getOriginalFare() { return originalFare; }
    public void setOriginalFare(double originalFare) { this.originalFare = originalFare; }
}
