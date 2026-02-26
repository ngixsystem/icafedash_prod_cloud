import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map } from "lucide-react";
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
          `<div style="font-family: 'Outfit', sans-serif; background: rgba(10,15,26,0.9); color: #e5e7eb; padding: 8px; border-radius: 12px; min-width: 160px;">
            <strong style="color: #22d3ee; font-size: 14px;">${club.name}</strong><br/>
            <span style="font-size:11px; opacity: 0.7;">${club.address || "Адрес не указан"}</span><br/>
            <div style="margin-top: 8px; font-size: 11px; font-weight: 600; color: ${color};">
               ${club.pcsFree} / ${club.pcsTotal} ПК свободно
            </div>
            <div style="font-size: 13px; font-weight: 800; margin-top: 4px;">
               ${club.pricePerHour} СУМ/ч
            </div>
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
    <div className="min-h-screen pb-32 bg-background">
      {/* Dynamic Background Element */}
      <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/10 via-transparent to-transparent -z-10 pointer-events-none" />

      <div className="px-6 pt-16 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
            <Map className="w-8 h-8 text-primary" />
            <span className="gradient-text uppercase">Карта</span>
          </h1>
          <div className="glass-dark px-3 py-1 rounded-full border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">В эфире</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">Свободные места в клубах города в реальном времени</p>
      </div>

      <div className="mx-6 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-[2rem] blur opacity-20 transition duration-500" />
        <div
          ref={mapRef}
          className="relative glass-dark rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl"
          style={{ height: "calc(100vh - 300px)", minHeight: "400px" }}
        />
      </div>

      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: rgba(10, 15, 26, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.25rem;
          color: white;
          padding: 4px;
        }
        .dark-popup .leaflet-popup-tip { 
          background: rgba(10, 15, 26, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .custom-marker { background: none !important; border: none !important; }
        .leaflet-container { background: #06080d !important; }
        .leaflet-control-zoom { border: none !important; margin: 20px !important; }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background: rgba(20, 24, 32, 0.8) !important;
          backdrop-filter: blur(8px) !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          margin-bottom: 5px !important;
        }
        .leaflet-bar a:first-child { border-top-left-radius: 12px !important; border-top-right-radius: 12px !important; }
        .leaflet-bar a:last-child { border-bottom-left-radius: 12px !important; border-bottom-right-radius: 12px !important; }
      `}</style>
    </div>
  );
}
