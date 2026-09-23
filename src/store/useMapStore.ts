import { create } from 'zustand';
import type { HeritageSite, HeritageRoute, Amenity } from '../lib/api';

interface MapState {
  sites: HeritageSite[];
  routes: HeritageRoute[];
  amenities: Amenity[];
  selectedSite: HeritageSite | null;
  loading: boolean;
  error: string | null;

  setSites: (s: HeritageSite[]) => void;
  setRoutes: (r: HeritageRoute[]) => void;
  setAmenities: (a: Amenity[]) => void;
  selectSite: (s: HeritageSite | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  sites: [],
  routes: [],
  amenities: [],
  selectedSite: null,
  loading: false,
  error: null,

  setSites: (sites) => set({ sites }),
  setRoutes: (routes) => set({ routes }),
  setAmenities: (amenities) => set({ amenities }),
  selectSite: (selectedSite) => set({ selectedSite }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));