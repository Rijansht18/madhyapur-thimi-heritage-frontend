import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRoutes, type HeritageRoute } from '../lib/api';
import HomeMap from '../components/HomeMap';

export default function HomePage() {
  const [routes, setRoutes] = useState<HeritageRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes()
      .then(setRoutes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-heritage-cream text-heritage-dark">
      <header className="bg-heritage-maroon text-white px-6 py-10 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-heritage-gold">
            Madhyapur Thimi Municipality
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-3 leading-tight">
            Madhyapur Thimi <br />
            Heritage Tour
          </h1>
          <p className="mt-4 max-w-2xl text-heritage-cream/85">
            Asta Matrika Heritage Circuit · Preserving Heritage · Promoting Tourism
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/map"
              className="inline-block bg-heritage-gold text-heritage-dark font-medium px-5 py-2 rounded-full text-sm hover:bg-white transition"
            >
              Open Full Map
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Routes list — each card opens the route MAP */}
        <section>
          <h2 className="font-display text-2xl text-heritage-maroon mb-4">
            Heritage Routes
          </h2>

          {loading && <p className="text-gray-500">Loading routes…</p>}
          {!loading && routes.length === 0 && (
            <p className="text-gray-500">No routes yet.</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {routes.map((r) => (
              <Link
                key={r.id}
                to={`/map?route=${r.id}`}
                className="group block p-6 rounded-2xl bg-white shadow hover:shadow-xl transition border border-heritage-gold/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-heritage-gold font-semibold">
                    {r.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {r.sites?.length ?? 0} sites
                  </span>
                </div>
                <h3 className="font-display text-xl text-heritage-maroon mt-2 group-hover:underline">
                  {r.name}
                </h3>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {r.description}
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  🚶 {r.distanceKm} km · ⏱ {r.estimatedMinutes} min
                </p>
                <p className="text-xs text-heritage-maroon mt-3 font-medium">
                  Open on map →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Full map — click anywhere to see nearest site */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-heritage-maroon">
              Explore the Area
            </h2>
            <Link
              to="/map"
              className="text-sm text-heritage-maroon hover:underline"
            >
              Full screen →
            </Link>
          </div>
          <div className="h-[400px] rounded-2xl overflow-hidden shadow border border-heritage-gold/30">
            <HomeMap />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Click anywhere on the map to see the nearest heritage site
          </p>
        </section>
      </main>

      <footer className="text-center text-xs text-heritage-dark/60 py-8 px-6">
        Heritage is Our Pride, Tourism is Our Future ·{' '}
        <Link to="/admin" className="underline hover:text-heritage-maroon">
          Admin
        </Link>
      </footer>
    </div>
  );
}