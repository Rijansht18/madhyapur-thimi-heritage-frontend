import axios from 'axios';
import { z } from 'zod';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1',
  timeout: 10000,
});

// ---------- Types ----------

export type SiteCategory = 'TEMPLE' | 'MONUMENT' | 'HISTORIC_PLACE' | 'CULTURAL_SITE';
export type RouteType = 'WALKING' | 'CYCLING' | 'DRIVING';
export type AmenityType =
  | 'RESTAURANT'
  | 'PARKING'
  | 'REST_AREA'
  | 'INFORMATION_CENTER'
  | 'TOILET';

// ---------- Zod Schemas (runtime validation) ----------

export const RouteSiteLinkSchema = z.object({
  routeId: z.string(),
  siteId: z.string(),
  order: z.number(),
});

export const HeritageSiteSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  nameNepali: z.string().nullable().optional(),
  description: z.string(),
  history: z.string().nullable().optional(),
  category: z.enum(['TEMPLE', 'MONUMENT', 'HISTORIC_PLACE', 'CULTURAL_SITE']),
  latitude: z.number(),
  longitude: z.number(),
  ward: z.number(),
  images: z.array(z.string()),
  audioUrl: z.string().nullable().optional(),
  arModelUrl: z.string().nullable().optional(),
  video360Url: z.string().nullable().optional(),
  isAstaMatrika: z.boolean(),
  order: z.number().nullable().optional(),
  routeSites: z.array(RouteSiteLinkSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});


export const HeritageRouteSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['WALKING', 'CYCLING', 'DRIVING']),
  path: z.array(z.array(z.number())),
  estimatedMinutes: z.number(),
  distanceKm: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sites: z
    .array(
      z.object({
        order: z.number(),
        site: HeritageSiteSchema,
      })
    )
    .optional(),
});

export const AmenitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['RESTAURANT', 'PARKING', 'REST_AREA', 'INFORMATION_CENTER', 'TOILET']),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type HeritageSite = z.infer<typeof HeritageSiteSchema>;
export type HeritageRoute = z.infer<typeof HeritageRouteSchema>;
export type Amenity = z.infer<typeof AmenitySchema>;

// ---------- API functions ----------

export async function fetchSites(params?: { astaMatrika?: boolean; ward?: number }) {
  const { data } = await api.get('/sites', { params });
  const parsed = z.array(HeritageSiteSchema).safeParse(data.data);
  if (!parsed.success) {
    console.error('⚠️ API contract mismatch (sites):', parsed.error.flatten());
    throw new Error('Invalid API response');
  }
  return parsed.data;
}

export async function fetchSiteBySlug(slug: string) {
  const { data } = await api.get(`/sites/${slug}`);
  const parsed = HeritageSiteSchema.safeParse(data.data);
  if (!parsed.success) {
    console.error('⚠️ API contract mismatch (site):', parsed.error.flatten());
    throw new Error('Invalid API response');
  }
  return parsed.data;
}

export async function fetchRoutes() {
  const { data } = await api.get('/routes');
  const parsed = z.array(HeritageRouteSchema).safeParse(data.data);
  if (!parsed.success) {
    console.error('⚠️ API contract mismatch (routes):', parsed.error.flatten());
    throw new Error('Invalid API response');
  }
  return parsed.data;
}

export async function fetchAmenities() {
  const { data } = await api.get('/amenities');
  const parsed = z.array(AmenitySchema).safeParse(data.data);
  if (!parsed.success) {
    console.error('⚠️ API contract mismatch (amenities):', parsed.error.flatten());
    throw new Error('Invalid API response');
  }
  return parsed.data;
}

export async function fetchSiteWithRoutes(slug: string) {
  const { data } = await api.get(`/sites/${slug}`);
  // Backend returns { routeSites: [{ route: {...}, ... }] }
  const site = data.data;
  const parsed = HeritageSiteSchema.extend({
    routeSites: z
      .array(
        RouteSiteLinkSchema.extend({
          route: HeritageRouteSchema,
        })
      )
      .optional(),
  }).safeParse(site);

  if (!parsed.success) {
    console.error('⚠️ API contract mismatch (site+routes):', parsed.error.flatten());
    throw new Error('Invalid API response');
  }
  return parsed.data;
}