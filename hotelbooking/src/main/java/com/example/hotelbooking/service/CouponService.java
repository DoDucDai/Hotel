package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.model.Coupon;
import com.example.hotelbooking.model.DiscountType;
import com.example.hotelbooking.repository.CouponRepository;

@Service
public class CouponService {

    private final CouponRepository couponRepository;

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

    public Coupon validateCoupon(String code, double orderAmount) {
        String normalizedCode = normalizeCode(code);
        if (normalizedCode == null) {
            return null;
        }

        ensureDefaultCoupons();

        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> new RuntimeException("Ma giam gia khong ton tai"));

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

    private void assertCouponUsable(Coupon coupon, double orderAmount) {
        if (!coupon.isActive()) {
            throw new RuntimeException("Ma giam gia da bi vo hieu hoa");
        }

        LocalDate expiresAt = coupon.getExpiresAt();
        if (expiresAt != null && expiresAt.isBefore(LocalDate.now())) {
            throw new RuntimeException("Ma giam gia da het han");
        }

        if (orderAmount < coupon.getMinOrderAmount()) {
            throw new RuntimeException(
                    "Don hang can toi thieu "
                            + Math.round(coupon.getMinOrderAmount())
                            + " de ap dung ma nay");
        }
    }

    private void ensureDefaultCoupons() {
        upsertDefaultCoupon("WELCOME10", "Giam 10% cho don tu 500.000 VND", DiscountType.PERCENT, 10, 500000, LocalDate.now().plusYears(2));
        upsertDefaultCoupon("STAY5", "Giam 5% cho moi booking", DiscountType.PERCENT, 5, 0, LocalDate.now().plusYears(2));
        upsertDefaultCoupon("LUXE200", "Giam truc tiep 200.000 VND", DiscountType.FIXED, 200000, 1500000, LocalDate.now().plusYears(2));
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
}
