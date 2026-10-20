import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useCart } from '../../lib/cart-context';
import { formatPrice } from '../../lib/format';
import { RouterLink } from '../../components/RouterLink';
import CartLineRow from './CartLineRow';
import SimilarItems from './SimilarItems';
import QuantityStepper from './QuantityStepper';
import { useCartItems } from './use-cart-items';

// The full cart page (/cart): every line with a quantity stepper and remove
// button, an order summary, and "You might also like" suggestions. Layout
// after the Zone template's ecommerce-cart-view (items left, summary right).
export default function Cart() {
  const { setQuantity, remove } = useCart();
  const { items, subtotal, loading } = useCartItems();
  const purchasable = items.some((i) => i.quantity > 0);

  return (
    <Container sx={{ py: { xs: 5, md: 10 } }}>
      <Typography variant="h2" sx={{ mb: { xs: 4, md: 6 } }}>
        Cart
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : items.length === 0 ? (
        <Stack spacing={3} alignItems="flex-start">
          <Typography sx={{ color: 'text.secondary' }}>No items added yet.</Typography>
          <Button component={RouterLink} href="/shop" variant="contained" color="primary">
            Browse the shop
          </Button>
        </Stack>
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 4, md: 8 }} alignItems="flex-start">
          <Box sx={{ flexGrow: 1, width: 1, minWidth: 0 }}>
            {items.map((cartItem) => (
              <Box key={cartItem.key} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <CartLineRow
                  cartItem={cartItem}
                  onRemove={() => remove(cartItem.key)}
                  quantityControl={
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatPrice(cartItem.price)}
                      </Typography>
                      <QuantityStepper
                        value={cartItem.quantity}
                        max={cartItem.maxQuantity}
                        onChange={(quantity) => setQuantity(cartItem.key, quantity)}
                        itemName={cartItem.item.name}
                      />
                    </Stack>
                  }
                />
              </Box>
            ))}
          </Box>

          <Card sx={{ p: 3, width: { xs: 1, md: 340 }, flexShrink: 0, bgcolor: 'background.default' }}>
            <Stack spacing={2}>
              <Typography variant="h6">Summary</Typography>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                <Typography>{formatPrice(subtotal)}</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Shipping and taxes are calculated at checkout.
              </Typography>
              <Divider />
              <Button
                component={RouterLink}
                href="/checkout"
                variant="contained"
                color="primary"
                size="large"
                disabled={!purchasable}
              >
                Checkout
              </Button>
              <Button component={RouterLink} href="/shop" color="primary">
                Continue shopping
              </Button>
            </Stack>
          </Card>
        </Stack>
      )}

      {!loading && (
        <Box sx={{ mt: { xs: 6, md: 10 } }}>
          <SimilarItems />
        </Box>
      )}
    </Container>
  );
}
