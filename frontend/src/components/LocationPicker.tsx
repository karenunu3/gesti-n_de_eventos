import React from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
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

// Coordenadas FIJAS — punto exacto del ISTPET (interior, no la puerta)
export const ISTPET_LAT = -0.281660;
export const ISTPET_LNG = -78.555455;
export const ISTPET_RADIUS_METERS = 100;

interface LocationPickerProps {
  /** Props ignoradas — la ubicación y radio son fijos del ISTPET. Se mantienen por compatibilidad. */
  radiusMeters?: number;
  latitude?: number | null;
  longitude?: number | null;
  onChange?: (lat: number, lng: number) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = () => {
  const position: [number, number] = [ISTPET_LAT, ISTPET_LNG];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold rounded-xl text-sm font-medium">
        <MapPin size={15} />
        <span>Ubicación fija: Instituto Superior Tecnológico Mayor Pedro Traversari · Radio {ISTPET_RADIUS_METERS}m</span>
      </div>
      <div className="h-[260px] w-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 relative z-0">
        <MapContainer
          center={position}
          zoom={19}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          zoomControl={false}
          keyboard={false}
          style={{ height: '100%', width: '100%', cursor: 'default' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          <Circle
            center={position}
            radius={ISTPET_RADIUS_METERS}
            pathOptions={{ color: '#1F295B', fillColor: '#1F295B', fillOpacity: 0.2 }}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
        Coordenadas: <span className="font-mono">{ISTPET_LAT}, {ISTPET_LNG}</span> · Esta ubicación es fija y no se puede modificar.
      </p>
    </div>
  );
};

export default LocationPicker;
