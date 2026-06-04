import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from '../../components/iconify';
import TextMaxLine from '../../components/text-max-line';
import { RouterLink } from '../../components/RouterLink';

const COLORS = ['primary', 'secondary', 'success', 'warning'] as const;

const PRODUCTS = [
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
  return (
    <Container sx={{ py: { xs: 5, md: 10 } }}>
      <Stack
        spacing={3}
        sx={{
          maxWidth: 480,
          mb: { xs: 8, md: 5 },
          mx: { xs: 'auto', md: 'unset' },
          textAlign: { xs: 'center', md: 'unset' },
        }}
      >
        <Typography variant="overline" sx={{ color: 'text.disabled' }}>
          Shop
        </Typography>

        <Typography variant="h2">What We Offer</Typography>

        <Typography sx={{ color: 'text.secondary' }}>
          Every item is made with care and a love for the weird. Browse the shop and find something
          that speaks to your inner creep.
        </Typography>
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
          <ShopCard key={product.name} product={product} index={index} />
        ))}
      </Box>
    </Container>
  );
}

function ShopCard({ product, index }: { product: typeof PRODUCTS[number]; index: number }) {
  const { name, icon, content, path } = product;

  return (
    <Card
      sx={{
        px: 4,
        py: 5,
        textAlign: 'center',
        ...(index === 1 && { py: { xs: 5, md: 8 } }),
        ...(index === 2 && {
          py: { xs: 5, md: 10 },
          boxShadow: '0 24px 48px 0 rgba(0,0,0,0.20)',
        }),
      }}
    >
      <Iconify
        icon={icon}
        width={88}
        sx={{ mx: 'auto', color: (theme) => theme.palette[COLORS[index]].main }}
      />

      <Stack spacing={1} sx={{ my: 5 }}>
        <TextMaxLine variant="h6">{name}</TextMaxLine>
        <TextMaxLine variant="body2" sx={{ color: 'text.secondary' }}>{content}</TextMaxLine>
      </Stack>

      <IconButton
        component={RouterLink}
        href={path}
        color={
          (index === 0 && 'primary') ||
          (index === 1 && 'secondary') ||
          (index === 2 && 'success') ||
          'warning'
        }
      >
        <Iconify icon="carbon:direction-straight-right" />
      </IconButton>
    </Card>
  );
}
