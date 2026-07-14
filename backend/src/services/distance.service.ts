/**
 * Calculates the straight-line distance between two GPS coordinates
 * using the Haversine formula.
 *
 * @param lat1 Latitude of first point (e.g. Shop)
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point (e.g. Delivery Address)
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  return parseFloat(distanceKm.toFixed(3)); // 3 decimal places precision (meters)
}

/**
 * Checks if a customer coordinate is within the delivery range.
 *
 * @param shopLat Shop latitude
 * @param shopLng Shop longitude
 * @param customerLat Customer latitude
 * @param customerLng Customer longitude
 * @param maxKm Allowed radius (default 2.2 km)
 */
export function isWithinDeliveryRadius(
  shopLat: number,
  shopLng: number,
  customerLat: number,
  customerLng: number,
  maxKm: number = 2.2
): { distance: number; eligible: boolean } {
  const distance = calculateHaversineDistance(shopLat, shopLng, customerLat, customerLng);
  return {
    distance,
    eligible: distance <= maxKm,
  };
}
