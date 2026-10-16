import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from '../../components/RouterLink';

// Placeholder until checkout (payment, shipping, orders) is built - gives
// the cart drawer's and cart page's Checkout buttons somewhere to land.
export default function Checkout() {
  return (
    <Container sx={{ py: { xs: 5, md: 10 } }}>
      <Stack spacing={3} alignItems="flex-start">
        <Typography variant="h2">Checkout</Typography>
        <Typography sx={{ color: 'text.secondary' }}>Checkout is coming soon.</Typography>
        <Button component={RouterLink} href="/cart" variant="outlined" color="primary">
          Back to cart
        </Button>
      </Stack>
    </Container>
  );
}
