export function resolveBookingContext(locationState, pendingBooking) {
  const resolved = locationState ?? pendingBooking ?? null;

  return {
    raw: resolved,
    hotel: resolved?.hotel ?? null,
    room: resolved?.room ?? null,
    searchCriteria: resolved?.searchCriteria ?? {},
  };
}
