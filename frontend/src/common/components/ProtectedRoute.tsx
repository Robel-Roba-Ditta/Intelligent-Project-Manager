import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function CenteredLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-light border-t-accent-done" />
    </div>
  );
}

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <CenteredLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <CenteredLoader />;
  if (user) return <Navigate to="/projects" replace />;
  return <Outlet />;
}
