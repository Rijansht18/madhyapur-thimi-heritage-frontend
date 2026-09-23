import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import HeritageMap from '../components/HeritageMap';
import { useMapStore } from '../store/useMapStore';
import { fetchSites, fetchRoutes } from '../lib/api';

export default function MapPage() {
  const [params, setParams] = useSearchParams();
  const {
    sites,
    setSites,
    routes,
    setRoutes,
    setLoading,
    setError,
    loading,
  } = useMapStore();

  const selectedRouteId = params.get('route') ?? 'all';
  const hasSpecificRoute = selectedRouteId !== 'all';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchSites(), fetchRoutes()])
      .then(([sitesData, routesData]) => {
        if (cancelled) return;
        setSites(sitesData);
        setRoutes(routesData);
      })
      .catch((e) => !cancelled && setError(e.message ?? 'Failed to load data'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [setSites, setRoutes, setLoading, setError]);

  // Sites to display:
  // - "all" → every site
  // - specific route → only that route's sites, in route order
  const visibleSites = useMemo(() => {
    if (selectedRouteId === 'all') return sites;
    const route = routes.find((r) => r.id === selectedRouteId);
    if (!route?.sites) return [];
    const orderedIds = [...route.sites]
      .sort((a, b) => a.order - b.order)
      .map((rs) => rs.site.id);
    const byId = new Map(sites.map((s) => [s.id, s]));
    return orderedIds
      .map((id) => byId.get(id))
      .filter(Boolean) as typeof sites;
  }, [sites, routes, selectedRouteId]);

  // Polyline only when a specific route is selected
  const circuitPath = useMemo<[number, number][]>(() => {
    if (!hasSpecificRoute) return [];
    return visibleSites.map(
      (s) => [s.latitude, s.longitude] as [number, number]
    );
  }, [visibleSites, hasSpecificRoute]);

  function changeRoute(id: string) {
    if (id === 'all') {
      params.delete('route');
    } else {
      params.set('route', id);
    }
    setParams(params, { replace: true });
  }

  // Pass route context to site detail via URL
  // (handled by HeritageMap navigation → we can't easily inject here, so we use
  //  a small trick: on route selected, we rewrite the URL to include ?route
  //  and let the detail page pick it up. Navigation is done by the marker click
  //  which goes to /site/:slug — no query param. We'll fix that in HeritageMap
  //  by appending route context when present.)

  return (
    <div className="h-screen flex flex-col bg-heritage-cream">
      <header className="bg-heritage-maroon text-white px-3 py-3 shadow">
        <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
          <Link
            to="/"
            className="text-sm hover:underline shrink-0 whitespace-nowrap"
          >
            ← Home
          </Link>

          <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
            <span className="hidden md:inline text-xs text-heritage-gold whitespace-nowrap">
              Route:
            </span>
            <select
              value={selectedRouteId}
              onChange={(e) => changeRoute(e.target.value)}
              className="text-sm bg-white/10 border border-heritage-gold/60 text-white rounded px-3 py-1.5 max-w-full truncate"
            >
              <option value="all" className="text-black">
                All Sites ({sites.length})
              </option>
              {routes.map((r) => (
                <option key={r.id} value={r.id} className="text-black">
                  {r.name} ({r.sites?.length ?? 0})
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-heritage-gold whitespace-nowrap">
            {loading ? 'Loading…' : `${visibleSites.length} shown`}
          </span>
        </div>
      </header>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-heritage-cream/80">
            <p className="text-heritage-maroon">Loading map…</p>
          </div>
        ) : (
          <HeritageMap
            sitesOverride={visibleSites}
            circuitPathOverride={circuitPath}
            showLabels={hasSpecificRoute}
            showPolyline={hasSpecificRoute}
            routeContextId={hasSpecificRoute ? selectedRouteId : undefined}
          />
        )}
      </div>
    </div>
  );
}