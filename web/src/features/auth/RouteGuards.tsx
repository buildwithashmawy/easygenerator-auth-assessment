import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useAuth } from './useAuth';

/** Only signed-in users; others are sent to sign-in and brought back afterwards. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'anonymous') {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Sign-in / sign-up are pointless once authenticated. */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/app'} replace />;
  }
  return <Outlet />;
}
