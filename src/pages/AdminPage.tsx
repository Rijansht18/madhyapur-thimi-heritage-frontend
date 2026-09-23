import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import AdminSitesTab from '../components/admin/AdminSitesTab';
import AdminRoutesTab from '../components/admin/AdminRoutesTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';

type Tab = 'sites' | 'routes' | 'users';

export default function AdminPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('sites');

  // Super Admin sees the Users tab
  const isSuper = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    // If a non-super admin was on the users tab, kick them back
    if (tab === 'users' && !isSuper) setTab('sites');
  }, [tab, isSuper]);

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-heritage-cream">
      <header className="bg-heritage-maroon text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="text-sm hover:underline shrink-0">
            ← Site
          </Link>
          <h1 className="font-display text-lg truncate">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xs text-right hidden sm:block">
            <div className="font-medium">{user?.fullName}</div>
            <div className="text-heritage-gold">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex gap-1 px-2">
          <TabButton
            active={tab === 'sites'}
            onClick={() => setTab('sites')}
            label="🛕 Sites"
          />
          <TabButton
            active={tab === 'routes'}
            onClick={() => setTab('routes')}
            label="🗺️ Routes"
          />
          {isSuper && (
            <TabButton
              active={tab === 'users'}
              onClick={() => setTab('users')}
              label="👤 Users"
            />
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        {tab === 'sites' && <AdminSitesTab />}
        {tab === 'routes' && <AdminRoutesTab />}
        {tab === 'users' && isSuper && <AdminUsersTab />}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
        active
          ? 'border-heritage-maroon text-heritage-maroon'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  );
}