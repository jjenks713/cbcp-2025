import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ImageIcon from '@mui/icons-material/Image';

import Image from '../../components/image';
import TextMaxLine from '../../components/text-max-line';
import { formatPrice } from '../../lib/format';
import { useCart } from '../../lib/cart-context';
import { type ShopItem } from '../../lib/contentful';

// Contentful Images API: a square crop sized for the grid, instead of the
// full-size upload.
const cardImageUrl = (url: string) => `${url}?w=600&h=600&fit=fill`;

// One product in the shop grid - adapted from the Zone template's
// ecommerce-product-view-grid-item (category, name, price under a square
// image), minus ratings/sale labels, plus a sold-out state.
export default function ShopItemCard({ item }: { item: ShopItem }) {
  const soldOut = item.stock <= 0;
  const { lines, add, openDrawer } = useCart();
  const inCart = lines.find((l) => l.id === item.id)?.quantity ?? 0;
  // Can't add more than there is in stock.
  const canAdd = !soldOut && inCart < item.stock;

  const handleAdd = () => {
    add(item.id);
    openDrawer();
  };

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          position: 'relative',
          '&:hover .add-to-cart, & .add-to-cart:focus-visible': { opacity: 1 },
        }}
      >
        {!soldOut && (
          <Tooltip title={canAdd ? 'Add to cart' : 'All in stock are in your cart'}>
            {/* span so the tooltip still works while the button is disabled */}
            <Box
              component="span"
              sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 9 }}
            >
              <Fab
                className="add-to-cart"
                color="primary"
                size="small"
                disabled={!canAdd}
                onClick={handleAdd}
                aria-label={`Add ${item.name} to cart`}
                sx={{
                  opacity: 0,
                  transition: (theme) => theme.transitions.create('opacity'),
                  // No hover on touch screens - keep it visible there.
                  '@media (hover: none)': { opacity: 1 },
                }}
              >
                <AddShoppingCartIcon fontSize="small" />
              </Fab>
            </Box>
          </Tooltip>
        )}
        {soldOut && (
          <Chip
            label="Sold out"
            size="small"
            sx={{ position: 'absolute', top: 8, left: 8, zIndex: 9, bgcolor: 'grey.900', color: 'common.white' }}
          />
        )}
        {item.coverUrl ? (
          <Image
            alt={item.name}
            src={cardImageUrl(item.coverUrl)}
            ratio="1/1"
            sx={{ borderRadius: 1.5, bgcolor: 'grey.800', ...(soldOut && { opacity: 0.55 }) }}
          />
        ) : (
          <Box
            sx={{
              pt: '100%',
              borderRadius: 1.5,
              bgcolor: 'grey.800',
              position: 'relative',
              color: 'grey.600',
            }}
          >
            <ImageIcon sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </Box>
        )}
      </Box>

      <Stack spacing={0.5}>
        <TextMaxLine variant="caption" line={1} sx={{ color: 'text.disabled' }}>
          {item.categoryName}
        </TextMaxLine>
        <TextMaxLine variant="body2" line={1} sx={{ fontWeight: 'fontWeightMedium' }}>
          {item.name}
        </TextMaxLine>
        <Typography variant="subtitle2" sx={{ color: soldOut ? 'text.disabled' : 'text.primary' }}>
          {formatPrice(item.price)}
        </Typography>
      </Stack>
    </Stack>
  );
}

export function ShopItemCardSkeleton() {
  return (
    <Stack spacing={2}>
      <Box sx={{ pt: '100%', position: 'relative' }}>
        <Skeleton variant="rounded" width="100%" height="100%" sx={{ position: 'absolute', top: 0, left: 0 }} />
      </Box>
      <Stack spacing={1}>
        <Skeleton variant="rounded" height={14} width="50%" />
        <Skeleton variant="rounded" height={16} width="85%" />
        <Skeleton variant="rounded" height={16} width="30%" />
      </Stack>
    </Stack>
  );
}
