import { Navigate, Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useShopEnabled } from '../hooks/use-shop-link';
import { useFlagsReady } from '../lib/launchdarkly-provider';

// Shop routes only exist while the hide-cbcp-shop LaunchDarkly flag is off.
// Waits for LaunchDarkly's real flag values before deciding - before then
// the flag reads as its hidden default, which would bounce a direct visit
// to /shop home even when the shop is live.
export default function ShopGate() {
  const ready = useFlagsReady();
  const shopEnabled = useShopEnabled();

  if (!ready) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!shopEnabled) return <Navigate to="/" replace />;

  return <Outlet />;
}
