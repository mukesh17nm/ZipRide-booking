package com.taxi.dto;

import com.taxi.model.PromoCode;

/**
 * Result DTO for promo code application.
 */
public class PromoApplyResult {

    private String promoCode;
    private boolean valid;
    private String validationMessage;
    private double originalFare;
    private double discountAmount;
    private double finalFare;
    private String discountType;
    private double discountValue;
    private PromoCode promoDetails;
    private String breakdown;
    private String message;

    public String getPromoCode() { return promoCode; }
    public void setPromoCode(String promoCode) { this.promoCode = promoCode; }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public String getValidationMessage() { return validationMessage; }
    public void setValidationMessage(String validationMessage) { this.validationMessage = validationMessage; }

    public double getOriginalFare() { return originalFare; }
    public void setOriginalFare(double originalFare) { this.originalFare = originalFare; }

    public double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(double discountAmount) { this.discountAmount = discountAmount; }

    public double getFinalFare() { return finalFare; }
    public void setFinalFare(double finalFare) { this.finalFare = finalFare; }

    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }

    public double getDiscountValue() { return discountValue; }
    public void setDiscountValue(double discountValue) { this.discountValue = discountValue; }

    public PromoCode getPromoDetails() { return promoDetails; }
    public void setPromoDetails(PromoCode promoDetails) { this.promoDetails = promoDetails; }

    public String getBreakdown() { return breakdown; }
    public void setBreakdown(String breakdown) { this.breakdown = breakdown; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
