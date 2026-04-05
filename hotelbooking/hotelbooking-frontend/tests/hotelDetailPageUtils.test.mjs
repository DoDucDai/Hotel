import test from "node:test";
import assert from "node:assert/strict";

import {
 formatPrice,
 formatReviewDate,
 normalizeBookings,
 normalizeHotels,
 normalizeReviews,
 normalizeRooms,
} from "../src/features/hotelDetail/hotelDetailPageUtils.js";

test("hotel detail normalize helpers handle array wrappers", () => {
 assert.deepEqual(normalizeRooms({ content: [{ id: "r1" }] }), [{ id: "r1" }]);
 assert.deepEqual(normalizeHotels({ data: [{ id: "h1" }] }), [{ id: "h1" }]);
 assert.deepEqual(normalizeReviews({ data: [{ id: "rv1" }] }), [{ id: "rv1" }]);
 assert.deepEqual(normalizeBookings({ content: [{ id: "b1" }] }), [{ id: "b1" }]);
});

test("formatPrice returns fallback for invalid values", () => {
 assert.equal(formatPrice("abc"), "Lien he");
 assert.match(formatPrice(1200000), /1\.200\.000/);
});

test("formatReviewDate returns empty string on invalid date", () => {
 assert.equal(formatReviewDate(null), "");
 assert.equal(formatReviewDate("invalid"), "");
});
