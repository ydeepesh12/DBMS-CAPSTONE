import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon issue in Leaflet React
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Hotspot {
  location_id: number;
  area_name: string;
  junction_name: string;
  latitude: number | string;
  longitude: number | string;
  zone_type: string;
  total_violations: number;
  critical_violations: number;
  total_fines_generated: number | string;
}

interface HotspotMapProps {
  hotspots: Hotspot[];
}

export const HotspotMap: React.FC<HotspotMapProps> = ({ hotspots }) => {
  // Center near Delhi / Northern capital corridor or default coordinates
  const defaultCenter: [number, number] = [28.6139, 77.2090];

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hotspots.map(h => {
          const lat = parseFloat(String(h.latitude));
          const lng = parseFloat(String(h.longitude));
          if (isNaN(lat) || isNaN(lng)) return null;

          const count = parseInt(String(h.total_violations || 0), 10);
          const radius = Math.min(1000, Math.max(300, count * 150));
          const color = count > 2 ? '#ef4444' : '#f59e0b';

          return (
            <React.Fragment key={h.location_id}>
              <Circle
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.25,
                  weight: 2
                }}
              />
              <Marker position={[lat, lng]} icon={customIcon}>
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <h4 className="font-bold text-slate-900">{h.area_name}</h4>
                    <p className="text-slate-600">{h.junction_name}</p>
                    <div className="pt-1 border-t border-slate-200 space-y-0.5">
                      <div className="flex justify-between space-x-2">
                        <span>Total Violations:</span>
                        <span className="font-bold text-red-600">{h.total_violations}</span>
                      </div>
                      <div className="flex justify-between space-x-2">
                        <span>Critical (Alcohol/WrongWay):</span>
                        <span className="font-bold text-amber-600">{h.critical_violations}</span>
                      </div>
                      <div className="flex justify-between space-x-2">
                        <span>Fines Levied:</span>
                        <span className="font-bold">₹{parseFloat(String(h.total_fines_generated || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
