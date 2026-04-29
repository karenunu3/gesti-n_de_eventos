import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Arreglar ícono por defecto de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconRetinaUrl: iconRetina,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Coordenadas fijas del ISTPET — Tecnológico Traversari
const ISTPET_LAT = -0.2824216;
const ISTPET_LNG = -78.5555266;

interface LocationPickerProps {
  radiusMeters: number;
  // Los campos latitude/longitude y onChange se mantienen por compatibilidad
  // pero la ubicación siempre es la del ISTPET
  latitude?: number;
  longitude?: number;
  onChange?: (lat: number, lng: number) => void;
}

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ radiusMeters }) => {
  const position: [number, number] = [ISTPET_LAT, ISTPET_LNG];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold rounded-xl text-sm font-medium">
        <MapPin size={15} />
        Ubicación fija: Instituto Superior Tecnológico Mayor Pedro Traversari
      </div>
      <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 relative z-0">
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          <Circle
            center={position}
            radius={radiusMeters}
            pathOptions={{ color: '#1F295B', fillColor: '#1F295B', fillOpacity: 0.15 }}
          />
          <MapUpdater center={position} />
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPicker;
