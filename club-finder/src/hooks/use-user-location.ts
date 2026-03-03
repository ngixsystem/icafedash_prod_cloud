import { useEffect, useState } from "react";
import type { GeoPoint } from "@/lib/distance";

export function useUserLocation() {
  const [location, setLocation] = useState<GeoPoint | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Ignore permission/timeouts: UI falls back to "distance unknown".
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  }, []);

  return location;
}
