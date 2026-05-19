import test from "node:test";
import assert from "node:assert/strict";

import {
 buildInitialHotelFilters,
 normalizeHotels,
 normalizeRooms,
 normalizeWishlist,
 toNonNegativeNumber,
 toPositiveInt,
} from "../src/features/hotels/hotelsPageUtils.js";

test("buildInitialHotelFilters applies safe defaults and prefill", () => {
 const filters = buildInitialHotelFilters({
 destination: "Da Nang",
 guests: "3",
 roomCount: "2",
 checkIn: "2026-06-01",
 checkOut: "2026-06-03",
 });

 assert.equal(filters.destination, "Da Nang");
 assert.equal(filters.guests, "3");
 assert.equal(filters.roomCount, "2");
 assert.equal(filters.checkIn, "2026-06-01");
 assert.equal(filters.checkOut, "2026-06-03");
 assert.equal(filters.amenity, "all");
 assert.equal(filters.wishlistOnly, false);
});

test("normalize helpers accept array and wrapped payloads", () => {
 assert.deepEqual(normalizeHotels([{ id: 1 }]), [{ id: 1 }]);
 assert.deepEqual(normalizeHotels({ content: [{ id: 2 }] }), [{ id: 2 }]);
 assert.deepEqual(normalizeRooms({ data: { content: [{ id: "r1" }] } }), [{ id: "r1" }]);
 assert.deepEqual(normalizeWishlist({ data: [{ hotelId: 1 }] }), [{ hotelId: 1 }]);
});

test("number parsers clamp invalid values", () => {
 assert.equal(toPositiveInt("0", 5), 5);
 assert.equal(toPositiveInt("3.7", 1), 3);
 assert.equal(toNonNegativeNumber(""), null);
 assert.equal(toNonNegativeNumber("-10"), null);
 assert.equal(toNonNegativeNumber("150000"), 150000);
});
