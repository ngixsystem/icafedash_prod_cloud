import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { clubs } from "@/data/clubs";

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([55.7558, 37.6173], 13);
    mapInstance.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '© OpenStreetMap © CARTO',
    }).addTo(map);

    clubs.forEach((club) => {
      const color = club.pcsFree > 10 ? "#22c55e" : club.pcsFree > 0 ? "#eab308" : "#ef4444";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #0a0f1a;
          box-shadow: 0 0 12px ${color}80;
          border: 2px solid ${color};
        ">${club.pcsFree}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([club.lat, club.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family: 'Space Grotesk', sans-serif; background: #141820; color: #e5e7eb; padding: 8px; border-radius: 8px; min-width: 160px;">
            <strong style="color: #22d3ee;">${club.name}</strong><br/>
            <span style="font-size:12px;">${club.address}</span><br/>
            <span style="font-size:12px; color: ${color};">${club.pcsFree} / ${club.pcsTotal} ПК свободно</span><br/>
            <span style="font-size:12px;">от ${club.pricePerHour} ₽/ч</span>
          </div>`,
          { className: "dark-popup" }
        )
        .on("click", () => navigate(`/club/${club.id}`));
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 pt-12 pb-3">
        <h1 className="text-xl font-display font-bold">🗺 Карта клубов</h1>
        <p className="text-xs text-muted-foreground">Свободные ПК в реальном времени</p>
      </div>
      <div ref={mapRef} className="mx-4 rounded-lg overflow-hidden border border-border" style={{ height: "calc(100vh - 180px)" }} />
      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: #141820;
          border: 1px solid #1e2330;
          box-shadow: 0 0 15px rgba(34,211,238,0.15);
        }
        .dark-popup .leaflet-popup-tip { background: #141820; }
        .custom-marker { background: none !important; border: none !important; }
      `}</style>
    </div>
  );
}
