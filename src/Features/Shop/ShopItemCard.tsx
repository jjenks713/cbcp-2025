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
import { type ShopItem } from '../../hooks/queries/shop';

// Contentful Images API: a square crop sized for the grid, instead of the
// full-size upload.
const cardImageUrl = (url: string) => `${url}?w=600&h=600&fit=fill`;

// One product in the shop grid - adapted from the Zone template's
// ecommerce-product-view-grid-item (category, name, price under a square
// image), minus ratings/sale labels, plus sold-out and in-cart tags. The
// cart button, image and name all open the item drawer, where the size
// and quantity are chosen.
export default function ShopItemCard({ item }: { item: ShopItem }) {
  const soldOut = item.stock <= 0;
  const { quantityOf, openItem } = useCart();
  const inCart = quantityOf(item.id);
  const show = () => openItem(item.id);

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          position: 'relative',
          '&:hover .add-to-cart, & .add-to-cart:focus-visible': { opacity: 1 },
        }}
      >
        {!soldOut && (
          <Tooltip title="Add to cart">
            <Fab
              className="add-to-cart"
              color="primary"
              size="small"
              onClick={show}
              aria-label={`Add ${item.name} to cart`}
              sx={{
                position: 'absolute',
                right: 8,
                bottom: 8,
                zIndex: 9,
                opacity: 0,
                transition: (theme) => theme.transitions.create('opacity'),
                // No hover on touch screens - keep it visible there.
                '@media (hover: none)': { opacity: 1 },
              }}
            >
              <AddShoppingCartIcon fontSize="small" />
            </Fab>
          </Tooltip>
        )}
        {(soldOut || inCart > 0) && (
          <Chip
            label={soldOut ? 'Sold out' : `${inCart} in cart`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 9,
              ...(soldOut
                ? { bgcolor: 'grey.900', color: 'common.white' }
                : { bgcolor: 'primary.main', color: 'secondary.main', fontWeight: 600 }),
            }}
          />
        )}
        <Box
          component="button"
          type="button"
          onClick={show}
          aria-label={`View ${item.name}`}
          sx={{ p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer', display: 'block', width: 1 }}
        >
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
      </Box>

      <Stack spacing={0.5}>
        <TextMaxLine variant="caption" line={1} sx={{ color: 'text.disabled' }}>
          {item.categoryName}
        </TextMaxLine>
        <TextMaxLine
          variant="body2"
          line={1}
          onClick={show}
          sx={{ fontWeight: 'fontWeightMedium', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
        >
          {item.name}
        </TextMaxLine>
        <Typography variant="subtitle2" sx={{ color: soldOut ? 'text.disabled' : 'text.primary' }}>
          {item.maxPrice > item.price ? `From ${formatPrice(item.price)}` : formatPrice(item.price)}
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
