import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function ProtectedRoute() {
  const { user, initialized, init } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-heritage-cream">
        <p className="text-heritage-maroon">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}