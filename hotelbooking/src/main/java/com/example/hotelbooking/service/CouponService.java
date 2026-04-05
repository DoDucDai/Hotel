package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.model.Coupon;
import com.example.hotelbooking.model.DiscountType;
import com.example.hotelbooking.repository.CouponRepository;

@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final Object couponSeedLock = new Object();
    private boolean defaultCouponsEnsured = false;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public List<Coupon> getActiveCoupons() {
        ensureDefaultCoupons();

        LocalDate today = LocalDate.now();
        return couponRepository.findByActiveTrue()
                .stream()
                .filter(coupon -> coupon.getExpiresAt() == null || !coupon.getExpiresAt().isBefore(today))
                .sorted(Comparator.comparing(Coupon::getCode, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public List<Coupon> getAllCoupons() {
        ensureDefaultCoupons();

        return couponRepository.findAll()
                .stream()
                .sorted(
                        Comparator.comparing(Coupon::isActive).reversed()
                                .thenComparing(
                                        Coupon::getExpiresAt,
                                        Comparator.nullsLast(Comparator.naturalOrder()))
                                .thenComparing(
                                        coupon -> coupon.getCode() == null ? "" : coupon.getCode(),
                                        String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public Coupon createCoupon(Coupon payload) {
        ensureDefaultCoupons();

        Coupon coupon = new Coupon();
        applyCouponChanges(coupon, payload);
        return couponRepository.save(coupon);
    }

    public Coupon updateCoupon(String id, Coupon payload) {
        ensureDefaultCoupons();

        Coupon coupon = couponRepository.findById(requireNonBlank(id, "Coupon id is required"))
                .orElseThrow(() -> new NotFoundException("Coupon khong ton tai"));

        applyCouponChanges(coupon, payload);
        return couponRepository.save(coupon);
    }

    public void deleteCoupon(String id) {
        Coupon coupon = couponRepository.findById(requireNonBlank(id, "Coupon id is required"))
                .orElseThrow(() -> new NotFoundException("Coupon khong ton tai"));

        couponRepository.delete(coupon);
    }

    public Coupon validateCoupon(String code, double orderAmount) {
        String normalizedCode = normalizeCode(code);
        if (normalizedCode == null) {
            return null;
        }

        ensureDefaultCoupons();

        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> new NotFoundException("Ma giam gia khong ton tai"));

        assertCouponUsable(coupon, orderAmount);
        return coupon;
    }

    public Coupon getCouponForExistingBooking(String code) {
        String normalizedCode = normalizeCode(code);
        if (normalizedCode == null) {
            return null;
        }

        ensureDefaultCoupons();
        return couponRepository.findByCodeIgnoreCase(normalizedCode).orElse(null);
    }

    public double calculateDiscount(double orderAmount, Coupon coupon) {
        if (coupon == null || orderAmount <= 0) {
            return 0;
        }

        double discount;
        if (coupon.getDiscountType() == DiscountType.FIXED) {
            discount = coupon.getDiscountValue();
        } else {
            discount = orderAmount * (coupon.getDiscountValue() / 100.0);
        }

        return Math.max(Math.min(discount, orderAmount), 0);
    }

    private void applyCouponChanges(Coupon coupon, Coupon payload) {
        Coupon safePayload = Objects.requireNonNull(payload, "Coupon payload is required");
        String normalizedCode = normalizeCode(
                requireNonBlank(safePayload.getCode(), "Ma giam gia khong duoc de trong"));

        couponRepository.findByCodeIgnoreCase(normalizedCode)
                .ifPresent(existing -> {
                    if (coupon.getId() == null || !coupon.getId().equals(existing.getId())) {
                        throw new BadRequestException("Ma giam gia da ton tai");
                    }
                });

        DiscountType discountType = safePayload.getDiscountType() == null
                ? DiscountType.PERCENT
                : safePayload.getDiscountType();

        double discountValue = safePayload.getDiscountValue();
        if (!Double.isFinite(discountValue) || discountValue <= 0) {
            throw new BadRequestException("Gia tri giam gia phai lon hon 0");
        }

        if (discountType == DiscountType.PERCENT && discountValue > 100) {
            throw new BadRequestException("Ma phan tram khong duoc vuot qua 100%");
        }

        String description = trimToNull(safePayload.getDescription());
        coupon.setCode(normalizedCode);
        coupon.setDescription(description != null ? description : "Coupon " + normalizedCode);
        coupon.setDiscountType(discountType);
        coupon.setDiscountValue(discountValue);
        coupon.setMinOrderAmount(Math.max(safePayload.getMinOrderAmount(), 0));
        coupon.setActive(safePayload.isActive());
        coupon.setExpiresAt(safePayload.getExpiresAt());
    }

    private void assertCouponUsable(Coupon coupon, double orderAmount) {
        if (!coupon.isActive()) {
            throw new BadRequestException("Ma giam gia da bi vo hieu hoa");
        }

        LocalDate expiresAt = coupon.getExpiresAt();
        if (expiresAt != null && expiresAt.isBefore(LocalDate.now())) {
            throw new BadRequestException("Ma giam gia da het han");
        }

        if (orderAmount < coupon.getMinOrderAmount()) {
            throw new BadRequestException(
                    "Don hang can toi thieu "
                            + Math.round(coupon.getMinOrderAmount())
                            + " de ap dung ma nay");
        }
    }

    private void ensureDefaultCoupons() {
        if (defaultCouponsEnsured) {
            return;
        }

        synchronized (couponSeedLock) {
            if (defaultCouponsEnsured) {
                return;
            }

            if (couponRepository.count() > 0) {
                defaultCouponsEnsured = true;
                return;
            }

            upsertDefaultCoupon("WELCOME10", "Giam 10% cho don tu 500.000 VND", DiscountType.PERCENT, 10, 500000, LocalDate.now().plusYears(2));
            upsertDefaultCoupon("STAY5", "Giam 5% cho moi booking", DiscountType.PERCENT, 5, 0, LocalDate.now().plusYears(2));
            upsertDefaultCoupon("LUXE200", "Giam truc tiep 200.000 VND", DiscountType.FIXED, 200000, 1500000, LocalDate.now().plusYears(2));
            defaultCouponsEnsured = true;
        }
    }

    private void upsertDefaultCoupon(
            String code,
            String description,
            DiscountType discountType,
            double discountValue,
            double minOrderAmount,
            LocalDate expiresAt) {

        if (couponRepository.findByCodeIgnoreCase(code).isPresent()) {
            return;
        }

        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setDescription(description);
        coupon.setDiscountType(discountType);
        coupon.setDiscountValue(discountValue);
        coupon.setMinOrderAmount(minOrderAmount);
        coupon.setActive(true);
        coupon.setExpiresAt(expiresAt);
        couponRepository.save(coupon);
    }

    private String normalizeCode(String code) {
        if (code == null) {
            return null;
        }

        String normalized = code.trim().toUpperCase();
        return normalized.isEmpty() ? null : normalized;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value;
    }
}
