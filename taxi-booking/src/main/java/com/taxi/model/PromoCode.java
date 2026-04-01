package com.taxi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a promotional discount code in the system.
 * discountType: PERCENTAGE | FLAT
 * status: ACTIVE | EXPIRED | DISABLED
 */
@Entity
@Table(name = "promo_codes")
public class PromoCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "description")
    private String description;

    // PERCENTAGE or FLAT
    @Column(name = "discount_type", nullable = false)
    private String discountType;

    // Value: 20.0 means 20% off OR ₹20 flat off
    @Column(name = "discount_value", nullable = false)
    private double discountValue;

    // Maximum discount cap (for PERCENTAGE types)
    @Column(name = "max_discount_amount")
    private Double maxDiscountAmount;

    // Minimum fare required to use the promo
    @Column(name = "min_fare_required", nullable = false)
    private double minFareRequired;

    // Max number of times this code can be used globally
    @Column(name = "max_usage_count", nullable = false)
    private int maxUsageCount;

    // How many times it has been used
    @Column(name = "usage_count", nullable = false)
    private int usageCount = 0;

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    // ACTIVE, EXPIRED, DISABLED
    @Column(name = "status", nullable = false)
    private String status;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }

    public double getDiscountValue() { return discountValue; }
    public void setDiscountValue(double discountValue) { this.discountValue = discountValue; }

    public Double getMaxDiscountAmount() { return maxDiscountAmount; }
    public void setMaxDiscountAmount(Double maxDiscountAmount) { this.maxDiscountAmount = maxDiscountAmount; }

    public double getMinFareRequired() { return minFareRequired; }
    public void setMinFareRequired(double minFareRequired) { this.minFareRequired = minFareRequired; }

    public int getMaxUsageCount() { return maxUsageCount; }
    public void setMaxUsageCount(int maxUsageCount) { this.maxUsageCount = maxUsageCount; }

    public int getUsageCount() { return usageCount; }
    public void setUsageCount(int usageCount) { this.usageCount = usageCount; }

    public LocalDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDateTime validFrom) { this.validFrom = validFrom; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
