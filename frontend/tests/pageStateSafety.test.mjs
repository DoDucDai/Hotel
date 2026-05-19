import test from "node:test";
import assert from "node:assert/strict";

import { resolveBookingContext } from "../src/features/booking/bookingPageUtils.js";
import {
  buildGoogleMapsSearchUrl,
  normalizeWishlistHotelIds,
  resolveHotelDetailState,
} from "../src/features/hotelDetail/hotelDetailUtils.js";

test("resolveBookingContext returns safe fallbacks when route state is missing", () => {
  const context = resolveBookingContext(undefined, null);

  assert.equal(context.hotel, null);
  assert.equal(context.room, null);
  assert.deepEqual(context.searchCriteria, {});
  assert.equal(context.raw, null);
});

test("resolveBookingContext prioritizes location.state over pendingBooking", () => {
  const locationState = { hotel: { id: 1, name: "A" }, room: { id: 2 } };
  const pendingBooking = { hotel: { id: 99, name: "B" } };

  const context = resolveBookingContext(locationState, pendingBooking);
  assert.equal(context.hotel?.id, 1);
  assert.equal(context.room?.id, 2);
});

test("resolveHotelDetailState handles missing location.state safely", () => {
  const state = resolveHotelDetailState(undefined);

  assert.equal(state.preloadedHotel, null);
  assert.deepEqual(state.searchCriteria, {});
});

test("buildGoogleMapsSearchUrl outputs valid Google Maps search URL", () => {
  const url = buildGoogleMapsSearchUrl({
    name: "Hotel A",
    address: "1 Nguyen Hue, HCM",
  });

  assert.equal(
    url,
    "https://www.google.com/maps/search/?api=1&query=Hotel%20A%201%20Nguyen%20Hue%2C%20HCM",
  );
});

test("normalizeWishlistHotelIds normalizes mixed id types to strings", () => {
  const ids = normalizeWishlistHotelIds({
    data: [{ hotelId: 1 }, { hotelId: "2" }, { hotelId: null }],
  });

  assert.deepEqual(ids, ["1", "2"]);
});
