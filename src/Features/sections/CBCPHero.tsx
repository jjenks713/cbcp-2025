import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import Image from '../../components/image';
import Iconify from '../../components/iconify';
import { bgGradient } from '../../Theme/css';
import { useResponsive } from '../../hooks/use-responsive';
import { RouterLink } from '../../components/RouterLink';
import { ETSY_SHOP_URL } from '../../lib/links';

export default function CBCPHero() {
  const theme = useTheme();
  const mdUp = useResponsive('up', 'md');

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/*
        Background photo lives in its own absolutely-positioned layer so the
        zoom (transform: scale) never touches the text/buttons. bgGradient()
        uses `background-size: cover` by default, which — unlike a fixed
        percentage — always fully fills the box no matter its aspect ratio,
        so this can't end up looking small/uncovered on mobile's much
        shorter, narrower hero area the way a percentage size could.
        transform: scale() zooms in while preserving that full coverage.
      */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          ...bgGradient({
            color: alpha(theme.palette.background.default, 0.9),
            imgUrl: '/assets/background/human-nature.jpg',
          }),
          transform: 'scale(1.3)',
        }}
      />

      <Container
        sx={{
          position: 'relative',
          py: 15,
          display: { md: 'flex' },
          alignItems: { md: 'center' },
          minHeight: { xs: '70vh', md: '100vh' },
        }}
      >
        <Box
          sx={{
            display: { md: 'flex' },
            alignItems: { md: 'center' },
            width: 1,
            columnGap: { md: 10 },
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: { md: '42%' },
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Creepy But Cute Press
            </Typography>

            <Typography variant="h1" sx={{ my: 3 }}>
              Where Weird Meets Beautiful
            </Typography>

            <Typography sx={{ color: 'text.secondary' }}>
              Original and fan art that blurs the line between the creepy and the adorable.
              Prints, stickers, buttons and more — made with love and a little darkness.
            </Typography>

            <Stack
              spacing={3}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'center', md: 'unset' }}
              justifyContent={{ xs: 'center', md: 'unset' }}
              sx={{ mt: 5 }}
            >
              {/* In-app shop isn't built yet — every shop link goes to Etsy for now. */}
              <Button
                component="a"
                href={ETSY_SHOP_URL}
                target="_blank"
                rel="noopener"
                variant="contained"
                color="inherit"
                size="large"
                sx={{ color: 'grey.900' }}
              >
                Shop Now
              </Button>

              <Stack
                component={RouterLink}
                href="/gallery"
                direction="row"
                alignItems="center"
                sx={{ typography: 'h6', textDecoration: 'none', color: 'common.white' }}
              >
                <Fab size="medium" sx={{ mr: 1, flexShrink: 0 }}>
                  <Iconify width={24} icon="carbon:play" />
                </Fab>
                See Our Work
              </Stack>
            </Stack>
          </Box>

          {mdUp && (
            <Box sx={{ flexGrow: 1 }}>
              <Image
                visibleByDefault
                disabledEffect
                alt="Creepy But Cute Press art"
                src="/assets/background/human-nature.jpg"
              />
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
