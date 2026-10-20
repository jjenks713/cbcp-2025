import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import Image from '../../components/image';
import { bgGradient } from '../../Theme/css';
import { MotionViewport, varFade, varZoom } from '../../components/animate';
import { useArtist } from '../../hooks/queries/content';
import { type ArtistProfile, contentfulImage } from '../../lib/contentful';
import { useShopLink } from '../../hooks/use-shop-link';

// Copy carried over verbatim from the old cbcp-next site's About page.
const FALLBACK_ARTIST: ArtistProfile = {
  name: 'Mary Jenkin',
  role: 'Creator',
  photoUrl: '/assets/images/portrait/artist_photo.jpg',
  bio: "I believe in making a living out of something you love doing. When I was given the ultimate question in school, “What do you want to be when you grow up?” – I had no clue. People kept saying that being an artist was a joke. I knew that I enjoyed drawing, I could sit all day and work on one piece of art. I was excited every time I saw myself improving. That was about the time I decided that I didn’t care what others thought. If I wanted to draw all day, design things, and create portraits, I would make that my career. I am still extremely excited when I see myself improve. I enjoy learning new mediums and techniques. I work very hard to keep producing art, improving with every step. Every day is a struggle, but each struggle leads to a new victory.",
  piecesSold: 0,
  followers: 0,
  yearsCreating: 0,
};

export default function CBCPArtist() {
  const theme = useTheme();
  const artist = useArtist().data ?? FALLBACK_ARTIST;
  // "Creepy but Cute Press" under the artist's name links to the shop.
  const shopLink = useShopLink();

  return (
    <Box
      id="meet-the-artist"
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.grey[900], 0.8),
          imgUrl: '/assets/background/overlay_2.jpg',
        }),
        overflow: 'hidden',
        py: { xs: 10, md: 15 },
      }}
    >
      <Container component={MotionViewport}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 6, md: 10 }}
          alignItems="center"
        >
          <Stack spacing={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box component={m.div} variants={varFade().inUp}>
              <Typography variant="overline" sx={{ color: 'grey.600' }}>
                Team
              </Typography>
            </Box>

            <Box component={m.div} variants={varFade().inUp}>
              <Typography variant="h2" sx={{ color: 'primary.main' }}>
                Meet the Artist
              </Typography>
            </Box>

            <Box component={m.div} variants={varFade().inUp}>
              <Typography sx={{ color: 'common.white' }}>{artist.bio}</Typography>
            </Box>

            <Stack
              component={m.div}
              variants={varFade().inUp}
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ pt: 1 }}
            >
              {artist.photoUrl && (
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={contentfulImage(artist.photoUrl, 600)} alt={artist.name} ratio="1/1" />
                </Box>
              )}
              <Stack spacing={0}>
                <Typography variant="subtitle2" sx={{ color: 'common.white', lineHeight: 1.4 }}>
                  {artist.name}
                </Typography>
                <Link
                  {...shopLink}
                  variant="body2"
                  sx={{ color: 'grey.400' }}
                >
                  Creepy but Cute Press
                </Link>
              </Stack>
            </Stack>
          </Stack>

          <Box
            component={m.div}
            variants={varZoom().in}
            sx={{ width: { xs: '80%', sm: '55%', md: '35%' }, flexShrink: 0 }}
          >
            <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Image src={contentfulImage(artist.photoUrl, 1000) || '/assets/images/portrait/artist_photo.jpg'} alt={artist.name} ratio="3/4" />
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
