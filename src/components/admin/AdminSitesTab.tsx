import { useEffect, useMemo, useState } from 'react';
import {
  fetchSites,
  fetchRoutes,
  type HeritageSite,
  type HeritageRoute,
} from '../../lib/api';
import {
  adminCreateSite,
  adminUpdateSite,
  adminDeleteSite,
} from '../../lib/adminApi';
import CoordinateInput from './CoordinateInput';
import { useAuthStore } from '../../store/useAuthStore';

const EMPTY: Partial<HeritageSite> = {
  slug: '',
  name: '',
  nameNepali: '',
  description: '',
  history: '',
  category: 'TEMPLE',
  latitude: 27.6786,
  longitude: 85.3833,
  ward: 1,
  images: [],
  audioUrl: '',
  arModelUrl: '',
  video360Url: '',
  // UI-only field (not in HeritageSite type)
};

interface FormState extends Partial<HeritageSite> {
  routeIds: string[];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminSitesTab() {
  const user = useAuthStore((s) => s.user);
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const canCreate = canDelete; // editors can't create either
  const canEdit = true; // everyone logged in can edit

  const [sites, setSites] = useState<HeritageSite[]>([]);
  const [routes, setRoutes] = useState<HeritageRoute[]>([]);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [s, r] = await Promise.all([fetchSites(), fetchRoutes()]);
    setSites(s);
    setRoutes(r);
  }

  useEffect(() => {
    load();
  }, []);

  const routeMap = useMemo(
    () => new Map(routes.map((r) => [r.id, r])),
    [routes]
  );

  function startNew() {
    setEditing({ ...EMPTY, routeIds: [] });
    setIsNew(true);
    setMsg(null);
  }

  function startEdit(s: HeritageSite) {
    setEditing({
      ...s,
      routeIds: s.routeSites?.map((rs) => rs.routeId) ?? [],
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
        slug: editing.slug?.trim() || slugify(editing.name ?? ''),
        name: editing.name,
        nameNepali: editing.nameNepali || null,
        description: editing.description,
        history: editing.history || null,
        category: editing.category,
        latitude: editing.latitude,
        longitude: editing.longitude,
        ward: editing.ward,
        images: editing.images ?? [],
        audioUrl: editing.audioUrl || null,
        arModelUrl: editing.arModelUrl || null,
        video360Url: editing.video360Url || null,
        routeIds: editing.routeIds,
      };

      if (isNew) await adminCreateSite(payload as any);
      else if (editing.id) await adminUpdateSite(editing.id, payload as any);

      setMsg('✅ Saved');
      setEditing(null);
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e?.response?.data?.error ?? e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: HeritageSite) {
    if (!canDelete) return;
    if (!confirm(`Delete "${s.name}"?`)) return;
    try {
      await adminDeleteSite(s.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? e.message);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* List */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-heritage-maroon">
            Sites ({sites.length})
          </h2>
          {canCreate && (
            <button
              onClick={startNew}
              className="text-xs px-3 py-1 rounded bg-heritage-maroon text-white"
            >
              + New Site
            </button>
          )}
        </div>

        <ul className="divide-y max-h-[70vh] overflow-y-auto">
          {sites.map((s) => (
            <li
              key={s.id}
              className="py-2 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="font-medium truncate text-sm">{s.name}</div>
                <div className="text-[11px] text-gray-500 truncate">
                  {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)} · Ward{' '}
                  {s.ward}
                  {s.routeSites && s.routeSites.length > 0 && (
                    <span className="ml-1 text-heritage-gold">
                      · {s.routeSites.length} route
                      {s.routeSites.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {canEdit && (
                  <button
                    onClick={() => startEdit(s)}
                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => remove(s)}
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

      {/* Form */}
      <div className="bg-white rounded-xl shadow p-4">
        {!editing && (
          <p className="text-gray-500 text-sm">
            Select a site
            {canCreate ? ' or click "+ New Site".' : ' to edit.'}
          </p>
        )}

        {editing && (
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <h3 className="font-display text-lg text-heritage-maroon sticky top-0 bg-white pb-2">
              {isNew ? 'New Site' : `Edit: ${editing.name}`}
            </h3>

            <F label="Name">
              <input
                value={editing.name ?? ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

            <F label="Slug (URL) — auto from name if empty">
              <input
                value={editing.slug ?? ''}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder={slugify(editing.name ?? '')}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

            <F label="Nepali Name (optional)">
              <input
                value={editing.nameNepali ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, nameNepali: e.target.value })
                }
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

            <div className="grid grid-cols-2 gap-2">
              <CoordinateInput
                label="Latitude"
                value={editing.latitude ?? 0}
                onChange={(v) => setEditing({ ...editing, latitude: v })}
                type="lat"
              />
              <CoordinateInput
                label="Longitude"
                value={editing.longitude ?? 0}
                onChange={(v) => setEditing({ ...editing, longitude: v })}
                type="lng"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <F label="Ward">
                <input
                  type="number"
                  value={editing.ward ?? 1}
                  onChange={(e) =>
                    setEditing({ ...editing, ward: Number(e.target.value) })
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </F>

              <F label="Category">
                <select
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      category: e.target.value as HeritageSite['category'],
                    })
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="TEMPLE">Temple</option>
                  <option value="MONUMENT">Monument</option>
                  <option value="HISTORIC_PLACE">Historic Place</option>
                  <option value="CULTURAL_SITE">Cultural Site</option>
                </select>
              </F>
            </div>

            {/* ✅ NEW: Route assignment */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                Add to Routes
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                {routes.length === 0 && (
                  <p className="text-xs text-gray-400">
                    No routes yet. Create a route first.
                  </p>
                )}
                {routes.map((r) => {
                  const checked = editing.routeIds.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...editing.routeIds, r.id]
                            : editing.routeIds.filter((id) => id !== r.id);
                          setEditing({ ...editing, routeIds: next });
                        }}
                      />
                      <span className="flex-1">{r.name}</span>
                      <span className="text-xs text-gray-500">
                        {r.sites?.length ?? 0} sites
                      </span>
                    </label>
                  );
                })}
              </div>
              {editing.routeIds.length > 0 && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Site will be added to:{' '}
                  {editing.routeIds
                    .map((id) => routeMap.get(id)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>

            <F label="Description">
              <textarea
                rows={3}
                value={editing.description ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

            <F label="History (optional)">
              <textarea
                rows={3}
                value={editing.history ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, history: e.target.value })
                }
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

            <F label="Image URLs (one per line)">
              <textarea
                rows={2}
                value={(editing.images ?? []).join('\n')}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    images: e.target.value
                      .split('\n')
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="https://example.com/img1.jpg"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

            <F label="Audio URL (optional)">
              <input
                value={editing.audioUrl ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, audioUrl: e.target.value })
                }
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>

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