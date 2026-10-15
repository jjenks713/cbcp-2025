import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import Image from '../../components/image';
import Iconify from '../../components/iconify';
import { fShortenNumber } from '../../utils/format-number';
import { RouterLink } from '../../components/RouterLink';
import { MotionViewport, varFade, varZoom, varTranEnter } from '../../components/animate';
import { useContentfulSingle } from '../../hooks/useContentfulData';
import { getArtist, type ArtistProfile } from '../../lib/contentful';

const FALLBACK_ARTIST: ArtistProfile = {
  name: 'Mary Jenkin',
  role: 'Creator',
  bio: "Creepy But Cute Press is the creative outlet of Mary Jenkin — an artist drawn to the peculiar, the strange, and the beautifully unsettling. From creepy-styled fan art to wholly original pieces, every work is designed to make you look twice. Expect characters that haunt your dreams in the best possible way — weird, wonderful, and unlike anything else you'll find.",
  piecesSold: 500,
  followers: 1000,
  yearsCreating: 10,
};

export default function CBCPAbout() {
  const artist = useContentfulSingle(getArtist, FALLBACK_ARTIST);

  const STATS = [
    {
      label: 'Pieces Sold',
      total: artist.piecesSold,
      content: 'Original works, prints, stickers and merch shipped to collectors worldwide.',
    },
    {
      label: 'Followers',
      total: artist.followers,
      content: 'A growing community of fans who love the strange and the beautifully unsettling.',
    },
    {
      label: 'Years Creating',
      total: artist.yearsCreating,
      content: 'A decade of honing a singular artistic voice that blends cute with creepy.',
    },
  ];

  return (
    <Container sx={{ py: { xs: 5, md: 10 } }}>
      {/*
        A framed gallery-wall shot of the artist's own work (chosen for its
        naturally wide ~16:9 composition) rather than a stock photo.

        This gets its own MotionViewport rather than sharing one with the
        text/stats below — the banner alone is over half this section's
        total height, so a single viewport trigger covering the whole
        section (checked against amount: 0.3 of the *combined* height)
        fires as soon as the banner is mostly in view, while the text and
        stats are still well below the fold. By the time they're actually
        visible they'd already be sitting at their final state — no
        animation to see. Separate viewports mean each piece triggers off
        its own visibility instead.
      */}
      <MotionViewport>
        <Box component={m.div} variants={varZoom().in}>
          <Image
            alt="A wall of framed Creepy But Cute Press artwork"
            src="https://images.ctfassets.net/lrvbgospprcp/4If2JgGZ7j6KWM22WaAuVe/0c5b09899118f3d2da11fedc9ebdfa21/Yue.jpg"
            ratio="16/9"
            sx={{ borderRadius: 1.5, mb: { xs: 5, md: 10 } }}
          />
        </Box>
      </MotionViewport>

      <Box
        component={MotionViewport}
        sx={{
          display: { md: 'flex' },
          columnGap: 3,
          justifyContent: 'space-between',
          rowGap: { xs: 5, md: 0 },
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box sx={{ width: { md: '42%' }, textAlign: { xs: 'center', md: 'right' } }}>
          <Box component={m.div} variants={varFade().inLeft}>
            <Typography component="div" variant="overline" sx={{ color: 'text.disabled' }}>
              About the Artist
            </Typography>
          </Box>

          <Box component={m.div} variants={varFade().inLeft} sx={{ my: 3 }}>
            <Typography variant="h2">The Mind Behind the Madness</Typography>
          </Box>

          <Box component={m.div} variants={varFade().inLeft}>
            <Typography sx={{ color: 'text.secondary' }}>{artist.bio}</Typography>
          </Box>

          {/* Jumps to the "Meet the Artist" section — see Routes.tsx. */}
          <Box component={m.div} variants={varFade().inLeft}>
            <Button
              component={RouterLink}
              href="/#meet-the-artist"
              size="large"
              color="inherit"
              endIcon={<Iconify icon="carbon:chevron-right" />}
              sx={{ my: 5 }}
            >
              Learn More
            </Button>
          </Box>
        </Box>

        <Box sx={{ width: { md: '52%' } }}>
          <Stack spacing={5}>
            {STATS.map((row, index) => (
              <Stack
                key={row.label}
                component={m.div}
                variants={varFade().inRight}
                // Left column animates in first; each stat row then slides
                // in from the right a little later than the one above it.
                transition={{ ...varTranEnter(), delay: 0.3 + index * 0.15 }}
                direction="row"
                alignItems="center"
                divider={
                  <Divider
                    flexItem
                    orientation="vertical"
                    sx={{ ml: 3, mr: 5, borderStyle: 'dashed' }}
                  />
                }
              >
                <Stack spacing={1} sx={{ width: 1, maxWidth: 100 }}>
                  <Stack direction="row">
                    <Typography variant="h2">{fShortenNumber(row.total)}</Typography>
                    <Box component="span" sx={{ color: 'primary.main', typography: 'h4' }}>+</Box>
                  </Stack>
                  <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                    {row.label}
                  </Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {row.content}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}
