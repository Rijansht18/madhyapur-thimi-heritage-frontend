import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  fetchSiteWithRoutes,
  fetchRoutes,
  type HeritageSite,
  type HeritageRoute,
} from "../lib/api";
import SiteMiniMap from "../components/SiteMiniMap";

type SiteWithRoutes = HeritageSite & {
  routeSites?: {
    routeId: string;
    siteId: string;
    order: number;
    route: HeritageRoute;
  }[];
};

export default function SiteDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [site, setSite] = useState<SiteWithRoutes | null>(null);
  const [allRoutes, setAllRoutes] = useState<HeritageRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Priority: URL param `?route=` always wins.
  const routeIdFromUrl = searchParams.get("route");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchSiteWithRoutes(slug), fetchRoutes()])
      .then(([s, r]) => {
        setSite(s as SiteWithRoutes);
        setAllRoutes(r);
      })
      .catch((e) => setError(e.message ?? "Failed to load site"))
      .finally(() => setLoading(false));
  }, [slug]);

  // Active route:
  // 1. URL param if present
  // 2. else if site belongs to exactly one route → that one
  // 3. else null (standalone site)
  const activeRouteId = useMemo(() => {
    return routeIdFromUrl; // can be null
  }, [routeIdFromUrl]);

  const activeRoute = useMemo(() => {
    if (!activeRouteId) return undefined;
    return allRoutes.find((r) => r.id === activeRouteId);
  }, [activeRouteId, allRoutes]);

  // Prev/Next within the ACTIVE route (not any other)
  const { prevSite, nextSite, position, total } = useMemo(() => {
    if (!activeRoute?.sites || !site) {
      return { prevSite: null, nextSite: null, position: 0, total: 0 };
    }
    const ordered = [...activeRoute.sites].sort((a, b) => a.order - b.order);
    const idx = ordered.findIndex((rs) => rs.site.id === site.id);
    if (idx === -1) {
      return { prevSite: null, nextSite: null, position: 0, total: 0 };
    }
    return {
      prevSite: idx > 0 ? ordered[idx - 1].site : null,
      nextSite: idx < ordered.length - 1 ? ordered[idx + 1].site : null,
      position: idx + 1,
      total: ordered.length,
    };
  }, [activeRoute, site]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-heritage-cream">
        <p className="text-heritage-maroon">Loading…</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-heritage-cream gap-4">
        <p className="text-heritage-maroon text-lg">
          {error ?? "Site not found"}
        </p>
        <Link to="/map" className="text-sm underline">
          ← Back to map
        </Link>
      </div>
    );
  }

  // Link that preserves the current route context
  function siteLink(siteSlug: string) {
    return activeRouteId
      ? `/site/${siteSlug}?route=${activeRouteId}`
      : `/site/${siteSlug}`;
  }

  return (
    <div className="min-h-screen bg-heritage-cream pb-24">
      <header className="bg-heritage-maroon text-white px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <Link
            to={activeRoute ? `/map?route=${activeRoute.id}` : "/map"}
            className="text-xs text-heritage-cream/80 hover:underline"
          >
            ← {activeRoute ? activeRoute.name : "Back to map"}
          </Link>

          <h1 className="font-display text-3xl mt-2">{site.name}</h1>
          {site.nameNepali && (
            <p className="text-heritage-gold text-sm">{site.nameNepali}</p>
          )}
          <p className="text-heritage-gold/90 text-xs mt-1">
            Ward {site.ward} · {site.category}
            {activeRoute && total > 0 && (
              <>
                {" · "}
                <span className="text-white/90">
                  Stop {position} of {total} in {activeRoute.name}
                </span>
              </>
            )}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 overflow-hidden">
          {site.images.length ? (
            <img
              src={site.images[0]}
              alt={site.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm">Image coming soon</span>
          )}
        </div>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="font-display text-xl text-heritage-maroon">About</h2>
          <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-line">
            {site.description}
          </p>
          {site.history && (
            <>
              <h3 className="font-display text-lg text-heritage-maroon mt-5">
                History
              </h3>
              <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-line">
                {site.history}
              </p>
            </>
          )}
        </section>

        {site.audioUrl && (
          <section className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-display text-xl text-heritage-maroon mb-3">
              🎧 Audio Guide
            </h2>
            <audio controls src={site.audioUrl} className="w-full" />
          </section>
        )}

        <section className="text-xs text-gray-500">
          <p>
            📍 {site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}
          </p>
        </section>
      </main>

      {/* Prev / Next floating bar (bottom) */}
      {activeRoute && total > 1 && (
        <nav className="fixed bottom-0 left-0 right-0 z-[900] bg-heritage-maroon text-white shadow-2xl h-20">
          <div className="max-w-3xl mx-auto flex items-stretch h-full">
            {prevSite ? (
              <Link
                to={siteLink(prevSite.slug)}
                className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition"
              >
                <span className="text-xl">←</span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-heritage-gold">
                    Previous
                  </div>
                  <div className="text-sm truncate">{prevSite.name}</div>
                </div>
              </Link>
            ) : (
              <div className="flex-1 px-4 py-3 opacity-40 text-sm flex items-center justify-center">
                Start of route
              </div>
            )}

            <div className="w-px bg-white/20" />

            {nextSite ? (
              <Link
                to={siteLink(nextSite.slug)}
                className="flex-1 flex items-center justify-end gap-3 px-4 py-3 hover:bg-white/10 transition text-right"
              >
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-heritage-gold">
                    Next
                  </div>
                  <div className="text-sm truncate">{nextSite.name}</div>
                </div>
                <span className="text-xl">→</span>
              </Link>
            ) : (
              <div className="flex-1 px-4 py-3 opacity-40 text-sm flex items-center justify-center">
                End of route
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Mini-map bottom-left, no polyline, expandable → full route map */}
      <SiteMiniMap site={site} route={activeRoute} />
    </div>
  );
}
