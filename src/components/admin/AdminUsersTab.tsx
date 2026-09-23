import { useEffect, useState } from 'react';
import {
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  type UserRecord,
} from '../../lib/adminApi';
import { useAuthStore } from '../../store/useAuthStore';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

interface NewUser {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  role: Role;
}

const EMPTY: NewUser = {
  email: '',
  username: '',
  password: '',
  fullName: '',
  phone: '',
  role: 'ADMIN',
};

export default function AdminUsersTab() {
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<NewUser>({ ...EMPTY });
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setUsers(await adminListUsers());
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setSaving(true);
    setMsg(null);
    try {
      await adminCreateUser({
        ...draft,
        phone: draft.phone || null,
      });
      setDraft({ ...EMPTY });
      setCreating(false);
      setMsg('✅ User created');
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e?.response?.data?.error ?? e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: UserRecord) {
    try {
      await adminUpdateUser(u.id, { isActive: !u.isActive });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? e.message);
    }
  }

  async function changeRole(u: UserRecord, role: Role) {
    try {
      await adminUpdateUser(u.id, { role });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? e.message);
    }
  }

  async function remove(u: UserRecord) {
    if (!confirm(`Delete ${u.fullName} (${u.email})?`)) return;
    try {
      await adminDeleteUser(u.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? e.message);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-heritage-maroon">
          Admin Users ({users.length})
        </h2>
        <button
          onClick={() => {
            setCreating(true);
            setMsg(null);
          }}
          className="text-xs px-3 py-1 rounded bg-heritage-maroon text-white"
        >
          + New Admin
        </button>
      </div>

      {msg && <p className="text-sm mb-3">{msg}</p>}

      {creating && (
        <div className="border rounded p-3 mb-4 bg-heritage-cream/40 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <F label="Email">
              <input
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>
            <F label="Username">
              <input
                value={draft.username}
                onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Full Name">
              <input
                value={draft.fullName}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>
            <F label="Phone (optional)">
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Password (min 8 chars)">
              <input
                type="password"
                value={draft.password}
                onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </F>
            <F label="Role">
              <select
                value={draft.role}
                onChange={(e) =>
                  setDraft({ ...draft, role: e.target.value as Role })
                }
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </F>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={create}
              disabled={saving}
              className="px-3 py-1.5 rounded bg-heritage-maroon text-white text-sm disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setDraft({ ...EMPTY });
              }}
              className="px-3 py-1.5 rounded bg-gray-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email / Username</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last login</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => {
              const isMe = me?.id === u.id;
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    {u.fullName} {isMe && <span className="text-xs text-heritage-gold">(you)</span>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div>{u.email}</div>
                    <div className="text-gray-500">@{u.username}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{u.phone ?? '—'}</td>
                  <td className="px-3 py-2">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      disabled={isMe}
                      className="text-xs border rounded px-1 py-0.5 disabled:opacity-60"
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="EDITOR">Editor</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={isMe}
                      className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 mr-1 disabled:opacity-50"
                    >
                      {u.isActive ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => remove(u)}
                      disabled={isMe}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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