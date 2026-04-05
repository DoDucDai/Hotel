import test from "node:test";
import assert from "node:assert/strict";

import {
 bookingMatchesDateRange,
 clampPercent,
 couponStatusMeta,
 getAvatarText,
 parseNonNegative,
} from "../src/features/admin/adminDashboardUtils.js";

test("bookingMatchesDateRange handles reversed from/to inputs", () => {
 const booking = {
 checkInDate: "2026-05-10",
 checkOutDate: "2026-05-12",
 };

 const result = bookingMatchesDateRange(booking, "2026-05-20", "2026-05-01");
 assert.equal(result, true);
});

test("bookingMatchesDateRange returns false when booking is outside date range", () => {
 const booking = {
 checkInDate: "2026-05-10",
 checkOutDate: "2026-05-12",
 };

 const result = bookingMatchesDateRange(booking, "2026-06-01", "2026-06-15");
 assert.equal(result, false);
});

test("couponStatusMeta detects inactive and expired coupons", () => {
 const inactive = couponStatusMeta({ active: false, expiresAt: "2099-01-01" });
 const expired = couponStatusMeta({ active: true, expiresAt: "2000-01-01" });

 assert.equal(inactive.kind, "inactive");
 assert.equal(expired.kind, "expired");
});

test("getAvatarText builds initials from full name and fallback", () => {
 assert.equal(getAvatarText("Nguyen Van A"), "NA");
 assert.equal(getAvatarText(""), "AD");
});

test("clampPercent and parseNonNegative normalize out-of-range values", () => {
 assert.equal(clampPercent(120.4), 100);
 assert.equal(clampPercent(-8), 0);
 assert.equal(parseNonNegative(5.9, 5), 5);
 assert.equal(parseNonNegative(-10), 0);
 assert.equal(parseNonNegative("not-number"), 0);
});
