import { Navigate, Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '../lib/auth-context';

export default function AuthRerouteProvider() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (user && window.location.pathname === '/login') {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
