import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { fetchSites, type HeritageSite } from '../lib/api';

// Haversine distance in meters
function distanceMeters(
  a: [number, number],
  b: [number, number]
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const CENTER: [number, number] = [27.6786, 85.3833];

function ClickHandler({
  sites,
  onPick,
}: {
  sites: HeritageSite[];
  onPick: (site: HeritageSite, distance: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (sites.length === 0) return;
      const click: [number, number] = [e.latlng.lat, e.latlng.lng];
      let best = sites[0];
      let bestDist = distanceMeters(click, [best.latitude, best.longitude]);
      for (const s of sites) {
        const d = distanceMeters(click, [s.latitude, s.longitude]);
        if (d < bestDist) {
          best = s;
          bestDist = d;
        }
      }
      onPick(best, bestDist);
    },
  });
  return null;
}

export default function HomeMap() {
  const [sites, setSites] = useState<HeritageSite[]>([]);
  const [picked, setPicked] = useState<{ site: HeritageSite; distance: number } | null>(null);

  useEffect(() => {
    fetchSites().then(setSites);
  }, []);

  // Custom icon for the "clicked point" indicator
  const clickIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: '<div style="background:#C9A227;width:14px;height:14px;border:2px solid white;border-radius:50%;box-shadow:0 0 0 2px #8B1E1E;"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    []
  );

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={CENTER}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler sites={sites} onPick={(site, distance) => setPicked({ site, distance })} />

        {/* Only show picked point, no permanent markers */}
        {picked && (
          <>
            <CircleMarker
              center={[picked.site.latitude, picked.site.longitude]}
              radius={10}
              pathOptions={{
                color: '#8B1E1E',
                fillColor: '#C9A227',
                fillOpacity: 0.9,
                weight: 2,
              }}
            />
            <Marker
              position={[picked.site.latitude, picked.site.longitude]}
              icon={clickIcon}
              interactive={false}
            />
          </>
        )}
      </MapContainer>

      {/* Info card (bottom) */}
      {picked && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white rounded-xl shadow-lg border border-heritage-gold/40 p-4 max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-heritage-gold font-semibold">
                Nearest Heritage Site
              </p>
              <h3 className="font-display text-lg text-heritage-maroon truncate">
                {picked.site.name}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {picked.distance < 1000
                  ? `${Math.round(picked.distance)} m away`
                  : `${(picked.distance / 1000).toFixed(2)} km away`}
                {' · '}Ward {picked.site.ward}
              </p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {picked.site.description}
              </p>
            </div>
            <button
              onClick={() => setPicked(null)}
              className="text-xs text-gray-400 hover:text-gray-700 shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              to={`/site/${picked.site.slug}`}
              className="text-xs bg-heritage-maroon text-white px-3 py-1.5 rounded hover:bg-heritage-maroon/90"
            >
              View Details →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}