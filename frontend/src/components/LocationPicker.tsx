import React from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Info } from 'lucide-react';

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

// Coordenadas base del ISTPET (Usadas como centro por defecto)
export const ISTPET_LAT = -0.281660;
export const ISTPET_LNG = -78.555455;
export const ISTPET_RADIUS_METERS = 100;

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number;
  onChange?: (lat: number, lng: number, radius: number) => void;
  isEditable?: boolean;
}

// Componente para capturar clics en el mapa cuando es editable
const MapClickHandler: React.FC<{
  isEditable: boolean;
  onSelect: (lat: number, lng: number) => void;
}> = ({ isEditable, onSelect }) => {
  useMapEvents({
    click(e) {
      if (isEditable) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  radiusMeters = 100,
  onChange,
  isEditable = false
}) => {
  const currentLat = latitude ?? ISTPET_LAT;
  const currentLng = longitude ?? ISTPET_LNG;
  const position: [number, number] = [currentLat, currentLng];

  const handleLocationSelect = (newLat: number, newLng: number) => {
    if (onChange && isEditable) {
      onChange(Number(newLat.toFixed(6)), Number(newLng.toFixed(6)), radiusMeters);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    if (onChange && isEditable) {
      onChange(currentLat, currentLng, newRadius);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.error('Error al obtener ubicación GPS:', err);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      {/* Encabezado e Instrucciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
          <MapPin size={16} className="text-istpet-blue dark:text-istpet-gold shrink-0" />
          <span>
            {isEditable
              ? 'Haz clic en el mapa para ubicar el evento o usa tu GPS'
              : 'Ubicación y Radio de Asistencia (Solo Lectura)'}
          </span>
        </div>

        {isEditable && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold hover:bg-istpet-blue/20 dark:hover:bg-istpet-gold/20 rounded-lg transition-colors shrink-0"
          >
            <Navigation size={13} />
            Usar mi GPS actual
          </button>
        )}
      </div>

      {/* Selector de Radio (Solo editable si es ADMIN) */}
      {isEditable && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Radio de Tolerancia:</span>
          <select
            value={radiusMeters}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold"
          >
            <option value={50}>50 metros</option>
            <option value={100}>100 metros (Estándar)</option>
            <option value={200}>200 metros</option>
            <option value={500}>500 metros</option>
            <option value={1000}>1000 metros (1 km)</option>
          </select>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">
            Margen permitido para validar el registro de asistencia.
          </span>
        </div>
      )}

      {/* Contenedor del Mapa */}
      <div className="h-[280px] w-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 relative z-0 shadow-inner">
        <MapContainer
          key={`${currentLat}-${currentLng}-${radiusMeters}`}
          center={position}
          zoom={18}
          scrollWheelZoom={isEditable}
          dragging={true}
          doubleClickZoom={isEditable}
          touchZoom={true}
          zoomControl={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler isEditable={isEditable} onSelect={handleLocationSelect} />
          <Marker position={position} />
          <Circle
            center={position}
            radius={radiusMeters}
            pathOptions={{ color: '#222C57', fillColor: '#222C57', fillOpacity: 0.25 }}
          />
        </MapContainer>
      </div>

      {/* Coordenadas y Detalles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 gap-1">
        <div>
          Coordenadas: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{currentLat}, {currentLng}</span>
        </div>
        <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
          <Info size={13} className="text-istpet-gold" />
          <span>Radio activo: <strong>{radiusMeters}m</strong></span>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
