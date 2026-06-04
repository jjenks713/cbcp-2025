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

export default function CBCPHero() {
  const theme = useTheme();
  const mdUp = useResponsive('up', 'md');

  return (
    <Box
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.background.default, 0.9),
          imgUrl: '/assets/background/skull-study.jpg',
        }),
        overflow: 'hidden',
      }}
    >
      <Container
        sx={{
          py: 15,
          display: { md: 'flex' },
          alignItems: { md: 'center' },
          height: { md: '100vh' },
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
              <Button
                component={RouterLink}
                href="/shop"
                variant="contained"
                color="inherit"
                size="large"
              >
                Shop Now
              </Button>

              <Stack
                component={RouterLink}
                href="/gallery"
                direction="row"
                alignItems="center"
                sx={{ typography: 'h6', textDecoration: 'none', color: 'inherit' }}
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
                src="/assets/illustrations/skull.jpg"
              />
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
