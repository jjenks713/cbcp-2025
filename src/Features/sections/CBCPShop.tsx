import type { ElementType } from 'react';
import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import BrushIcon from '@mui/icons-material/Brush';
import LabelIcon from '@mui/icons-material/Label';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import type { Theme } from '@mui/material/styles';

import TextMaxLine from '../../components/text-max-line';
import { MotionViewport, varFade, varZoom } from '../../components/animate';
import { useShopCategories, withFallback } from '../../hooks/queries/content';
import { ETSY_SHOP_URL } from '../../lib/links';

// 'secondary' is deliberately excluded — it's the theme's near-black
// background color (#262626), not a usable accent against a dark card.
const COLORS = ['primary', 'info', 'success', 'warning'] as const;

// The "icon" field on a Contentful shop category is free text, so it has to be
// mapped to a fixed MUI icon rather than rendered directly (unlike Iconify,
// which could render any icon name as-is). Keyed by the exact string values
// already used in Contentful/FALLBACK_PRODUCTS below, so existing content
// keeps working; anything else - e.g. a new value a content editor types in
// without knowing this list - falls back to DEFAULT_SHOP_ICON. The admin
// panel offers exactly these keys as choices for that field.
export const SHOP_ICONS: Record<string, ElementType> = {
  'carbon:image-copy': PhotoLibraryIcon,
  'ph:paint-brush-bold': BrushIcon,
  'ph:sticker-bold': LabelIcon,
  'carbon:shopping-bag': ShoppingBagIcon,
};
const DEFAULT_SHOP_ICON = ShoppingBagIcon;

const FALLBACK_PRODUCTS = [
  {
    name: 'Custom Prints',
    icon: 'carbon:image-copy',
    content: 'High-quality art prints of original and fan art, available in multiple sizes.',
    path: '/shop/prints',
  },
  {
    name: 'Original Pieces',
    icon: 'ph:paint-brush-bold',
    content: 'One-of-a-kind original artworks — own something truly unique.',
    path: '/shop/originals',
  },
  {
    name: 'Stickers',
    icon: 'ph:sticker-bold',
    content: 'Waterproof die-cut stickers perfect for laptops, water bottles, and more.',
    path: '/shop/stickers',
  },
  {
    name: 'Buttons & Merch',
    icon: 'carbon:shopping-bag',
    content: 'Enamel pins, buttons, tote bags, and apparel with original CBCP designs.',
    path: '/shop/merch',
  },
];

export default function CBCPShop() {
  const PRODUCTS = withFallback(useShopCategories().data, FALLBACK_PRODUCTS);

  return (
    <Container component={MotionViewport} sx={{ py: { xs: 5, md: 10 } }}>
      <Stack
        spacing={3}
        sx={{
          maxWidth: 480,
          mb: { xs: 8, md: 5 },
          mx: { xs: 'auto', md: 'unset' },
          textAlign: { xs: 'center', md: 'unset' },
        }}
      >
        <Box component={m.div} variants={varFade().inUp}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>
            Shop
          </Typography>
        </Box>

        <Box component={m.div} variants={varFade().inUp}>
          <Typography variant="h2">What We Offer</Typography>
        </Box>

        <Box component={m.div} variants={varFade().inUp}>
          <Typography sx={{ color: 'text.secondary' }}>
            Every item is made with care and a love for the weird. Browse the shop and find
            something that speaks to your inner creep.
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          gap: 4,
          display: 'grid',
          alignItems: 'center',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
        }}
      >
        {PRODUCTS.map((product, index) => (
          <Box key={product.name} component={m.div} variants={varZoom().in}>
            <ShopCard product={product} index={index} />
          </Box>
        ))}
      </Box>
    </Container>
  );
}

function ShopCard({ product, index }: { product: typeof FALLBACK_PRODUCTS[number]; index: number }) {
  const { name, icon, content } = product;
  const color = COLORS[index % COLORS.length];
  const ShopIcon = SHOP_ICONS[icon] ?? DEFAULT_SHOP_ICON;

  return (
    <Card
      sx={{
        px: 4,
        py: 5,
        textAlign: 'center',
        // No bgcolor override here defaults to MUI's background.paper
        // (white), and the theme's near-white default text color is
        // invisible on that — same bug as the Art section's cards.
        bgcolor: 'background.default',
        ...(index === 1 && { py: { xs: 5, md: 8 } }),
        ...(index === 2 && {
          py: { xs: 5, md: 10 },
          boxShadow: '0 24px 48px 0 rgba(0,0,0,0.20)',
        }),
      }}
    >
      <ShopIcon sx={{ fontSize: 88, mx: 'auto', color: (theme: Theme) => theme.palette[color].main }} />

      <Stack spacing={1} sx={{ my: 5 }}>
        <TextMaxLine variant="h6">{name}</TextMaxLine>
        <TextMaxLine variant="body2" sx={{ color: 'text.secondary' }}>{content}</TextMaxLine>
      </Stack>

      {/* In-app shop isn't built yet — every shop link goes to Etsy for now. */}
      <IconButton component="a" href={ETSY_SHOP_URL} target="_blank" rel="noopener" color={color}>
        <ArrowForward />
      </IconButton>
    </Card>
  );
}
