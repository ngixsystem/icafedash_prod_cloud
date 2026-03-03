export interface GeoPoint {
  lat: number;
  lng: number;
}

export function hasValidCoords(lat?: number, lng?: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === undefined || lng === undefined) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  // API fallback values can be 0/0 when location is missing.
  if (lat === 0 && lng === 0) return false;
  return true;
}

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return earthRadiusKm * y;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} м`;
  }
  return `${km.toFixed(1)} км`;
}
