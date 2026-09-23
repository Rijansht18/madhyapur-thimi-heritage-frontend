import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import type { HeritageSite, HeritageRoute } from '../lib/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, zoom, map]);
  return null;
}

interface Props {
  site: HeritageSite;
  route?: HeritageRoute;
  /** Lift the mini-map above the fixed Prev/Next bar */
  liftedForNav?: boolean;
}

export default function SiteMiniMap({
  site,
  route,
  liftedForNav = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const fullMapUrl = route ? `/map?route=${route.id}` : '/map';

  // If expanded, render a full-screen overlay
  if (expanded) {
    return (
      <div className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
          {/* Header */}
          <div className="bg-heritage-maroon text-white px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-heritage-gold">
                {route ? route.name : 'Location'}
              </p>
              <h3 className="font-display text-lg truncate">{site.name}</h3>
              <p className="text-xs text-heritage-cream/80">
                Ward {site.ward} · {site.latitude.toFixed(5)},{' '}
                {site.longitude.toFixed(5)}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                to={fullMapUrl}
                className="text-xs bg-heritage-gold text-heritage-dark font-medium px-3 py-1.5 rounded hover:bg-white transition"
              >
                Open in Full Map →
              </Link>
              <button
                onClick={() => setExpanded(false)}
                aria-label="Close"
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Big interactive map */}
          <div className="flex-1 relative">
            <MapContainer
              center={[site.latitude, site.longitude]}
              zoom={18}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[site.latitude, site.longitude]} />
              <Recenter
                lat={site.latitude}
                lng={site.longitude}
                zoom={18}
              />
            </MapContainer>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed mini-map
  const bottomClass = liftedForNav ? 'bottom-24' : 'bottom-4';

  return (
    <div className={`fixed ${bottomClass} left-4 z-[950] transition-all`}>
      <div className="w-[180px] h-[130px] rounded-xl overflow-hidden shadow-2xl border-2 border-white bg-white relative group">
        <MapContainer
          center={[site.latitude, site.longitude]}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          touchZoom={false}
          tap={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[site.latitude, site.longitude]} />
          <Recenter lat={site.latitude} lng={site.longitude} zoom={17} />
        </MapContainer>

        {/* Expand → in-place modal */}
        <button
          onClick={() => setExpanded(true)}
          title="Expand map"
          className="absolute top-1 right-1 bg-white/95 hover:bg-white text-heritage-maroon text-xs px-2 py-0.5 rounded shadow z-[1000]"
        >
          ⤢
        </button>

        {/* Full-screen overlay shortcut */}
        <Link
          to={fullMapUrl}
          className="absolute bottom-1 left-1 bg-heritage-maroon text-white text-[10px] px-2 py-0.5 rounded shadow z-[1000] hover:bg-heritage-maroon/90"
        >
          Full Map →
        </Link>
      </div>
    </div>
  );
}