import { Navigate, Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth, type AuthUser } from '../lib/auth-context';

type Props = {
  // Restrict to a role on top of being logged in; anyone else lands on /account.
  role?: AuthUser['role'];
};

export default function RequireAuth({ role }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
