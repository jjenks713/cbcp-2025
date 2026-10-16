import { useNavigate } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useAuth } from '../lib/auth-context';

// Proves the login flow end-to-end. Order history / profile editing for
// regular users and the Contentful-editing admin panel are separate,
// not-yet-built features.
export default function Account() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 10, md: 15 } }}>
      <Stack spacing={3} alignItems="center" textAlign="center">
        <Typography variant="h3" sx={{ color: 'primary.main' }}>
          Account
        </Typography>
        <Typography sx={{ color: 'common.white' }}>
          Logged in as {user?.email} ({user?.role})
        </Typography>
        <Button variant="contained" color="primary" onClick={handleLogout}>
          Log Out
        </Button>
      </Stack>
    </Container>
  );
}
