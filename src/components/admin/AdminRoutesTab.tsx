import { useEffect, useState } from 'react';
import {
  fetchSites,
  fetchRoutes,
  type HeritageSite,
  type HeritageRoute,
} from '../../lib/api';
import {
  adminCreateRoute,
  adminUpdateRoute,
  adminDeleteRoute,
} from '../../lib/adminApi';
import { useAuthStore } from '../../store/useAuthStore';

interface EditingRoute {
  id?: string;
  slug: string;
  name: string;
  description: string;
  type: 'WALKING' | 'CYCLING' | 'DRIVING';
  estimatedMinutes: number;
  distanceKm: number;
  siteIds: string[];
}

const EMPTY: EditingRoute = {
  slug: '',
  name: '',
  description: '',
  type: 'WALKING',
  estimatedMinutes: 60,
  distanceKm: 1,
  siteIds: [],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminRoutesTab() {
  const [routes, setRoutes] = useState<HeritageRoute[]>([]);
  const [sites, setSites] = useState<HeritageSite[]>([]);
  const [editing, setEditing] = useState<EditingRoute | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // At the top of AdminRoutesTab component:
const user = useAuthStore((s) => s.user);
const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
const canCreate = canDelete;
const canEdit = true;

  async function load() {
    const [rs, ss] = await Promise.all([fetchRoutes(), fetchSites()]);
    setRoutes(rs);
    setSites(ss);
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setEditing({ ...EMPTY });
    setIsNew(true);
    setMsg(null);
  }

  function startEdit(r: HeritageRoute) {
    setEditing({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      type: r.type as EditingRoute['type'],
      estimatedMinutes: r.estimatedMinutes,
      distanceKm: r.distanceKm,
      siteIds: r.sites?.map((rs) => rs.site.id) ?? [],
    });
    setIsNew(false);
    setMsg(null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        slug: editing.slug?.trim() || slugify(editing.name),
        name: editing.name,
        description: editing.description,
        type: editing.type,
        estimatedMinutes: editing.estimatedMinutes,
        distanceKm: editing.distanceKm,
        siteIds: editing.siteIds,
      };
      if (isNew) await adminCreateRoute(payload);
      else if (editing.id) await adminUpdateRoute(editing.id, payload);

      setMsg('✅ Saved');
      setEditing(null);
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e?.response?.data?.error ?? e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: HeritageRoute) {
    if (!confirm(`Delete "${r.name}"?`)) return;
    try {
      await adminDeleteRoute(r.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? e.message);
    }
  }

  // Helpers for editing sites list
  function addSite(siteId: string) {
    if (!editing || editing.siteIds.includes(siteId)) return;
    setEditing({ ...editing, siteIds: [...editing.siteIds, siteId] });
  }

  function removeSite(index: number) {
    if (!editing) return;
    const next = [...editing.siteIds];
    next.splice(index, 1);
    setEditing({ ...editing, siteIds: next });
  }

  function moveSite(index: number, dir: -1 | 1) {
    if (!editing) return;
    const next = [...editing.siteIds];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setEditing({ ...editing, siteIds: next });
  }

  const siteMap = new Map(sites.map((s) => [s.id, s]));
  const availableSites = editing
    ? sites.filter((s) => !editing.siteIds.includes(s.id))
    : sites;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-heritage-maroon">
            Routes ({routes.length})
          </h2>
          {canCreate && (
          <button
            onClick={startNew}
            className="text-xs px-3 py-1 rounded bg-heritage-maroon text-white"
          >
            + New Route
          </button>
          )}
        </div>

        <ul className="divide-y">
          {routes.map((r) => (
            <li
              key={r.id}
              className="py-2 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="font-medium truncate text-sm">{r.name}</div>
                <div className="text-[11px] text-gray-500 truncate">
                  {r.type} · {r.sites?.length ?? 0} sites · {r.distanceKm} km ·{' '}
                  {r.estimatedMinutes} min
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {canEdit && (
                <button
                  onClick={() => startEdit(r)}
                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800"
                >
                  Edit
                </button>
                )}
                {canDelete && (
                <button
                  onClick={() => remove(r)}
                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-800"
                >
                  Del
                </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        {!editing && (
          <p className="text-gray-500 text-sm">
            Select a route or click “+ New Route”.
          </p>
        )}

        {editing && (
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <h3 className="font-display text-lg text-heritage-maroon sticky top-0 bg-white pb-2">
              {isNew ? 'New Route' : `Edit: ${editing.name}`}
            </h3>

            <F label="Name">
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

            <F label="Slug (auto if empty)">
              <input
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder={slugify(editing.name)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

            <F label="Description">
              <textarea
                rows={3}
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

            <div className="grid grid-cols-3 gap-2">
              <F label="Type">
                <select
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      type: e.target.value as EditingRoute['type'],
                    })
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="WALKING">Walking</option>
                  <option value="CYCLING">Cycling</option>
                  <option value="DRIVING">Driving</option>
                </select>
              </F>

              <F label="Minutes">
                <input
                  type="number"
                  value={editing.estimatedMinutes}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      estimatedMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </F>

              <F label="Km">
                <input
                  type="number"
                  step="0.1"
                  value={editing.distanceKm}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      distanceKm: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </F>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                Sites in this route (order matters)
              </p>
              <ul className="space-y-1 mb-2">
                {editing.siteIds.map((id, idx) => {
                  const s = siteMap.get(id);
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-2 bg-gray-50 border rounded px-2 py-1 text-sm"
                    >
                      <span className="w-6 text-center text-xs text-gray-500">
                        {idx + 1}
                      </span>
                      <span className="flex-1 truncate">
                        {s?.name ?? '⚠️ missing site'}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveSite(idx, -1)}
                        className="text-xs px-1 hover:bg-gray-200 rounded"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSite(idx, 1)}
                        className="text-xs px-1 hover:bg-gray-200 rounded"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSite(idx)}
                        className="text-xs px-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>

              <F label="Add a site">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addSite(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">— Select site —</option>
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Ward {s.ward})
                    </option>
                  ))}
                </select>
              </F>
            </div>

            <div className="flex gap-2 pt-2 sticky bottom-0 bg-white py-2 border-t">
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded bg-heritage-maroon text-white text-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setMsg(null);
                }}
                className="px-4 py-2 rounded bg-gray-200 text-sm"
              >
                Cancel
              </button>
              {msg && <span className="text-sm self-center">{msg}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function F({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}