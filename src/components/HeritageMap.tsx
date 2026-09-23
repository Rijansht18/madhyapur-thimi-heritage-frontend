// client/src/components/HeritageMap.tsx
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import { useNavigate } from 'react-router-dom';
import type { HeritageSite } from '../lib/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const templeIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const CENTER: [number, number] = [27.6786, 85.3833];

function RecenterOnSelect() {
  const selected = useMapStore((s) => s.selectedSite);
  const map = useMap();

  useEffect(() => {
    if (selected) {
      map.flyTo([selected.latitude, selected.longitude], 17, {
        duration: 1,
      });
    }
  }, [selected, map]);

  return null;
}

interface Props {
  sitesOverride?: HeritageSite[];
  circuitPathOverride?: [number, number][];
  showLabels?: boolean;
  showPolyline?: boolean;
  routeContextId?: string;
}

export default function HeritageMap({
  sitesOverride,
  circuitPathOverride,
  showLabels = false,
  showPolyline = false,
  routeContextId,
}: Props) {
  const storeSites = useMapStore((s) => s.sites);
  const sites = sitesOverride ?? storeSites;
  const navigate = useNavigate();

  const circuitPath: [number, number][] = circuitPathOverride ?? [];

  return (
    <MapContainer
      center={CENTER}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Polyline only when explicitly enabled (i.e. a route is selected) */}
      {showPolyline && circuitPath.length > 1 && (
        <Polyline
          positions={circuitPath}
          pathOptions={{
            color: '#8B1E1E',
            weight: 3,
            dashArray: '8 8',
          }}
        />
      )}

      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[site.latitude, site.longitude]}
          icon={templeIcon}
          eventHandlers={{
  click: () =>
    navigate(
      routeContextId
        ? `/site/${site.slug}?route=${routeContextId}`
        : `/site/${site.slug}`
    ),
}}

        >
          {showLabels && (
            <Tooltip
              permanent
              direction="bottom"
              offset={[0, 8]}
              className="!bg-white !border !border-heritage-maroon !text-heritage-maroon !text-xs !font-semibold !rounded-md !px-2 !py-1 !shadow"
            >
              {site.name}
            </Tooltip>
          )}

          <Popup>
            <div className="text-sm min-w-[180px]">
              <strong className="text-heritage-maroon block">
                {site.name}
              </strong>
              <span className="text-xs text-gray-600 block mt-1">
                Ward {site.ward} · {site.category}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}

      <RecenterOnSelect />
    </MapContainer>
  );
}