import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';

import { useCart } from '../../lib/cart-context';
import { formatPrice } from '../../lib/format';
import TextMaxLine from '../../components/text-max-line';
import { useShopCatalog, type ShopItem } from '../../hooks/queries/shop';
import { contentfulImage } from '../../lib/contentful';

const MAX_ITEMS = 10;
const TILE = 128;

type Props = {
  // Skip fetching while hidden (the cart drawer is mounted on every page).
  enabled?: boolean;
  // Text/border colors for the dark cart drawer vs the cart page
  muted?: string;
};

/**
 * Up to MAX_ITEMS in-stock items that aren't already in the cart: first
 * from the same categories as what's in it, then the newest - so an empty
 * cart still gets suggestions.
 */
function pickSuggestions(items: ShopItem[], cartIds: Set<string>) {
  const inCart = items.filter((i) => cartIds.has(i.id));
  const categories = new Set(inCart.map((i) => i.categoryId));
  const candidates = items.filter((i) => !cartIds.has(i.id) && i.stock > 0);
  const sameCategory = candidates.filter((i) => categories.has(i.categoryId));
  const others = candidates.filter((i) => !categories.has(i.categoryId));
  return [...sameCategory, ...others].slice(0, MAX_ITEMS);
}

// "You might also like" - a scrolling row of suggestions at the bottom of
// the cart drawer and cart page. The + adds one straight to the cart;
// items with sizes (and tapping an item) open the item drawer instead so a
// size can be chosen.
export default function SimilarItems({ enabled = true, muted = 'text.secondary' }: Props) {
  const { lines, add, openItem, closeDrawer } = useCart();
  const itemsQuery = useShopCatalog({ enabled });

  const suggestions = useMemo(
    () => pickSuggestions(itemsQuery.data ?? [], new Set(lines.map((l) => l.id))),
    [itemsQuery.data, lines]
  );

  if (!suggestions.length) return null;

  const showItem = (item: ShopItem) => {
    closeDrawer();
    openItem(item.id);
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1">You might also like</Typography>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          pb: 1,
          '& > *': { scrollSnapAlign: 'start' },
          // Thin, subtle scrollbar instead of the browser's bright default.
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.25) transparent',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255, 255, 255, 0.25)', borderRadius: 3 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        }}
      >
        {suggestions.map((item) => (
          <Stack key={item.id} spacing={0.75} sx={{ width: TILE, flexShrink: 0 }}>
            <Box sx={{ position: 'relative' }}>
              <Box
                component="button"
                type="button"
                onClick={() => showItem(item)}
                aria-label={`View ${item.name}`}
                sx={{ p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer', display: 'block', width: 1 }}
              >
                {item.coverUrl ? (
                  <Box
                    component="img"
                    src={contentfulImage(item.coverUrl, 256, { square: true })}
                    alt=""
                    loading="lazy"
                    sx={{ width: TILE, height: TILE, objectFit: 'cover', borderRadius: 1.5, display: 'block', bgcolor: 'grey.800' }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: TILE,
                      height: TILE,
                      borderRadius: 1.5,
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
              </Box>
              <Tooltip title={item.sizes.length ? 'Choose a size' : 'Quick add'}>
                <IconButton
                  size="small"
                  onClick={() => (item.sizes.length ? showItem(item) : add(item.id))}
                  aria-label={item.sizes.length ? `Choose a size for ${item.name}` : `Add ${item.name} to cart`}
                  sx={{
                    position: 'absolute',
                    right: 6,
                    bottom: 6,
                    bgcolor: 'primary.main',
                    color: 'secondary.main',
                    boxShadow: 3,
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <TextMaxLine variant="body2" line={1}>
              {item.name}
            </TextMaxLine>
            <Typography variant="caption" sx={{ color: muted }}>
              {item.maxPrice > item.price ? `From ${formatPrice(item.price)}` : formatPrice(item.price)}
              {item.sizes.length > 0 && ` · ${item.sizes.length} sizes`}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
