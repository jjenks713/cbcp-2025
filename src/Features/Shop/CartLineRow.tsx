import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { formatPrice } from '../../lib/format';
import { useCart } from '../../lib/cart-context';
import { RouterLink } from '../../components/RouterLink';
import { shopItemHref } from './item-link';
import { type CartItem } from './use-cart-items';

type Props = {
  cartItem: CartItem;
  onRemove: () => void;
  // Optional control in place of the "price × qty" line, e.g. the cart
  // page's quantity picker.
  quantityControl?: ReactNode;
};

// One item in the cart drawer / cart page - thumbnail, name, price and
// quantity, line total and a remove button. Styled after the Zone
// template's ecommerce-cart-item.
export default function CartLineRow({ cartItem, onRemove, quantityControl }: Props) {
  const { item, quantity, lineTotal } = cartItem;
  const soldOut = quantity === 0;
  // The name link leaves the cart drawer (when shown in it).
  const { closeDrawer } = useCart();

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 2 }}>
      {item.coverUrl ? (
        <Box
          component="img"
          src={`${item.coverUrl}?w=128&h=128&fit=fill`}
          alt=""
          sx={{ width: 64, height: 64, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0, bgcolor: 'grey.800' }}
        />
      ) : (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1.5,
            flexShrink: 0,
            bgcolor: 'grey.800',
            color: 'grey.600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageIcon />
        </Box>
      )}

      <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
        {/* Back to the item's category in the shop, with its drawer open. */}
        <Link
          component={RouterLink}
          href={shopItemHref(item)}
          onClick={closeDrawer}
          variant="subtitle2"
          noWrap
          underline="hover"
          sx={{ color: 'inherit', display: 'block', '&:hover': { color: 'primary.main' } }}
        >
          {item.name}
        </Link>
        {cartItem.size && (
          <Typography variant="caption" sx={{ color: 'grey.500' }}>
            Size: {cartItem.size}
          </Typography>
        )}
        {soldOut ? (
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            Sold out
          </Typography>
        ) : (
          quantityControl ?? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {formatPrice(cartItem.price)} × {quantity}
            </Typography>
          )
        )}
      </Stack>

      <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>
        {formatPrice(lineTotal)}
      </Typography>

      <Tooltip title="Remove">
        <IconButton
          size="small"
          aria-label={`Remove ${item.name} from cart`}
          onClick={onRemove}
          sx={{ color: 'grey.400', '&:hover': { color: 'error.main' } }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
