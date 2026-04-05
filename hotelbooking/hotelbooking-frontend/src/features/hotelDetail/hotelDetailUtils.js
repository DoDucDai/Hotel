function normalizeList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export function resolveHotelDetailState(locationState) {
  return {
    preloadedHotel: locationState?.hotel ?? null,
    searchCriteria: locationState?.searchCriteria ?? {},
  };
}

export function buildGoogleMapsSearchUrl(hotel) {
  const query = `${hotel?.name || ""} ${hotel?.address || ""}`.trim();
  if (!query) {
    return "https://www.google.com/maps";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function normalizeWishlistHotelIds(payload) {
  return normalizeList(payload)
    .map((item) => String(item?.hotelId || ""))
    .filter(Boolean);
}
