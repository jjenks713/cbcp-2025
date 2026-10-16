import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';

import { useCart } from '../../lib/cart-context';
import { formatPrice } from '../../lib/format';
import { RouterLink } from '../../components/RouterLink';
import CartLineRow from './CartLineRow';
import { useCartItems } from './use-cart-items';

// Slide-out cart, opened from the nav's cart button (or after adding an
// item). Lists what's in the cart with a remove button each, the
// subtotal, and links to the full cart page and checkout.
export default function CartDrawer() {
  const { drawerOpen, closeDrawer, remove } = useCart();
  const { items, subtotal, loading } = useCartItems();
  const purchasable = items.some((i) => i.quantity > 0);

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={closeDrawer}
      slotProps={{
        paper: { sx: { width: { xs: 1, sm: 400 }, bgcolor: 'secondary.main', color: 'common.white' } },
      }}
    >
      <Stack sx={{ height: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2 }}>
          <Typography variant="h6">Your cart</Typography>
          <IconButton onClick={closeDrawer} aria-label="Close cart" sx={{ color: 'common.white' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress color="primary" />
            </Box>
          )}
          {!loading && items.length === 0 && (
            <Stack alignItems="center" spacing={2} sx={{ py: 10, color: 'grey.500', textAlign: 'center' }}>
              <ShoppingCartOutlinedIcon sx={{ fontSize: 48 }} />
              <Typography>No items added yet</Typography>
            </Stack>
          )}
          {!loading &&
            items.map((cartItem) => (
              <Box key={cartItem.item.id} sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }}>
                <CartLineRow cartItem={cartItem} onRemove={() => remove(cartItem.item.id)} />
              </Box>
            ))}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
        <Stack spacing={2} sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle1">Subtotal</Typography>
            <Typography variant="subtitle1">{formatPrice(subtotal)}</Typography>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button
              component={RouterLink}
              href="/cart"
              onClick={closeDrawer}
              variant="outlined"
              color="primary"
              fullWidth
            >
              View cart
            </Button>
            <Button
              component={RouterLink}
              href="/checkout"
              onClick={closeDrawer}
              variant="contained"
              color="primary"
              fullWidth
              disabled={!purchasable}
            >
              Checkout
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Drawer>
  );
}
