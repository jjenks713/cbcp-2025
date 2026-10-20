import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

import { formatPrice } from '../../lib/format';
import { lineKey, useCart } from '../../lib/cart-context';
import { useShopCatalog, variantFor, type ShopItem } from '../../hooks/queries/shop';
import QuantityStepper from './QuantityStepper';
import { contentfulImage } from '../../lib/contentful';

const DIVIDER = 'rgba(255, 255, 255, 0.12)';

// Product quick view: opened from a shop card's cart button (or its image
// or name), a "You might also like" item that needs a size, or a link to
// /shop?item=<id>. Shows the photos and description, lets the customer pick
// a size (sold-out sizes are disabled; the price follows the size) and how
// many, then adds them to the cart and switches to the cart drawer.
export default function ItemDrawer() {
  const { itemDrawerId, closeItem } = useCart();
  const catalog = useShopCatalog({ enabled: Boolean(itemDrawerId) });
  const item = catalog.data?.find((i) => i.id === itemDrawerId);

  return (
    <Drawer
      anchor="right"
      open={Boolean(itemDrawerId)}
      onClose={closeItem}
      slotProps={{
        paper: { sx: { width: { xs: 1, sm: 440 }, bgcolor: 'secondary.main', color: 'common.white' } },
      }}
    >
      <Stack direction="row" justifyContent="flex-end" sx={{ px: 2, pt: 1.5 }}>
        <IconButton onClick={closeItem} aria-label="Close" sx={{ color: 'common.white' }}>
          <CloseIcon />
        </IconButton>
      </Stack>
      {item ? (
        // Keyed so size/quantity/photo reset for each item opened.
        <ItemDetails key={item.id} item={item} />
      ) : (
        itemDrawerId && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            {catalog.isPending ? (
              <CircularProgress color="primary" />
            ) : (
              <Typography sx={{ color: 'grey.500' }}>This item isn&apos;t available.</Typography>
            )}
          </Box>
        )
      )}
    </Drawer>
  );
}

function ItemDetails({ item }: { item: ShopItem }) {
  const { lines, add, closeItem, openDrawer } = useCart();
  const [photo, setPhoto] = useState(item.coverUrl);
  const inStockSizes = item.variants.filter((v) => v.size && v.stock > 0).map((v) => v.size as string);
  // Pre-select when there's only one size that can be bought.
  const [size, setSize] = useState<string | null>(
    item.sizes.length && inStockSizes.length === 1 ? inStockSizes[0] : null
  );
  const [quantity, setQuantity] = useState(1);

  const hasSizes = item.sizes.length > 0;
  const variant = hasSizes ? (size ? variantFor(item, size) : undefined) : variantFor(item);
  const inCart = lines.find((l) => lineKey(l) === lineKey({ id: item.id, size: size ?? undefined }))?.quantity ?? 0;
  const available = variant ? Math.max(variant.stock - inCart, 0) : 0;
  const soldOut = item.stock <= 0;
  const needsSize = hasSizes && !size;

  const priceLabel = variant
    ? formatPrice(variant.price)
    : item.maxPrice > item.price
      ? `${formatPrice(item.price)} – ${formatPrice(item.maxPrice)}`
      : formatPrice(item.price);

  const handleAdd = () => {
    add(item.id, Math.min(quantity, available), size ?? undefined);
    closeItem();
    openDrawer();
  };

  return (
    <Stack spacing={3} sx={{ px: 3, pb: 4, overflowY: 'auto' }}>
      <Stack spacing={1.5}>
        {photo ? (
          <Box
            component="img"
            src={contentfulImage(photo, 880, { square: true })}
            alt={item.name}
            sx={{ width: 1, aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 2, bgcolor: 'grey.800' }}
          />
        ) : (
          <Box
            sx={{
              width: 1,
              aspectRatio: '1 / 1',
              borderRadius: 2,
              bgcolor: 'grey.800',
              color: 'grey.600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon sx={{ fontSize: 48 }} />
          </Box>
        )}
        {item.imageUrls.length > 1 && (
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto' }}>
            {item.imageUrls.map((url, i) => (
              <Box
                key={url}
                component="button"
                type="button"
                onClick={() => setPhoto(url)}
                aria-label={`Show photo ${i + 1}`}
                sx={{
                  p: 0,
                  border: 2,
                  borderColor: url === photo ? 'primary.main' : 'transparent',
                  borderRadius: 1.5,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src={contentfulImage(url, 128, { square: true })}
                  alt=""
                  sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, display: 'block' }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline" sx={{ color: 'grey.500' }}>
          {item.categoryName}
        </Typography>
        <Typography variant="h5">{item.name}</Typography>
        <Typography variant="h6" sx={{ color: 'primary.main' }}>
          {priceLabel}
        </Typography>
      </Stack>

      {item.description && (
        <Typography variant="body2" sx={{ color: 'grey.400', whiteSpace: 'pre-line' }}>
          {item.description}
        </Typography>
      )}

      {soldOut ? (
        <Typography sx={{ color: 'error.main' }}>Sold out</Typography>
      ) : (
        <Stack spacing={2.5} sx={{ borderTop: 1, borderColor: DIVIDER, pt: 3 }}>
          {hasSizes && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Size</Typography>
              <ToggleButtonGroup
                exclusive
                value={size}
                onChange={(_, next: string | null) => {
                  if (!next) return;
                  setSize(next);
                  setQuantity(1);
                }}
                aria-label="Size"
                sx={{ flexWrap: 'wrap', gap: 1 }}
              >
                {item.variants.map((v) => {
                  const out = v.stock <= 0;
                  return (
                    <ToggleButton
                      key={v.size}
                      value={v.size as string}
                      size="small"
                      disabled={out}
                      aria-label={out ? `${v.size} - sold out` : v.size}
                      sx={{
                        px: 2,
                        color: 'common.white',
                        borderColor: 'grey.700',
                        borderRadius: '8px !important',
                        border: '1px solid !important',
                        textTransform: 'none',
                        flexDirection: 'column',
                        lineHeight: 1.2,
                        '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'primary.main', color: 'secondary.main' },
                        '&.Mui-disabled': { color: 'grey.600', borderColor: 'grey.800', textDecoration: 'line-through' },
                      }}
                    >
                      {v.size}
                      {(out || v.price !== item.basePrice) && (
                        <Box component="span" sx={{ fontSize: 11, opacity: 0.8, textDecoration: 'none' }}>
                          {out ? 'Sold out' : formatPrice(v.price)}
                        </Box>
                      )}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            </Stack>
          )}

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2">Quantity</Typography>
            <QuantityStepper
              value={Math.min(quantity, Math.max(available, 1))}
              min={1}
              max={Math.max(available, 1)}
              onChange={setQuantity}
              itemName={item.name}
            />
            {variant && variant.stock > 0 && variant.stock <= 5 && (
              <Typography variant="caption" sx={{ color: 'warning.main' }}>
                Only {variant.stock} left
              </Typography>
            )}
          </Stack>

          {inCart > 0 && (
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              {inCart} {hasSizes ? 'of this size ' : ''}already in your cart
              {available === 0 ? ' - that’s all we have' : ''}.
            </Typography>
          )}

          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<AddShoppingCartIcon />}
            onClick={handleAdd}
            disabled={needsSize || available === 0}
          >
            {needsSize ? 'Choose a size' : 'Add to cart'}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
