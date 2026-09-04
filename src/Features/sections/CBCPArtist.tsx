import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import Image from '../../components/image';
import { bgGradient } from '../../Theme/css';

export default function CBCPArtist() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.grey[900], 0.8),
          imgUrl: '/assets/background/overlay_2.jpg',
        }),
        overflow: 'hidden',
        py: { xs: 10, md: 15 },
      }}
    >
      <Container>
        <Stack spacing={3} sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography variant="overline" sx={{ color: 'grey.600' }}>
            Team
          </Typography>
          <Typography variant="h2" sx={{ color: 'primary.main' }}>
            Meet the Artist
          </Typography>
          <Typography sx={{ color: 'common.white', maxWidth: 480, mx: 'auto' }}>
            One artist. One vision. Every piece crafted by hand with an obsessive attention to
            detail and a deep love for everything wonderfully strange.
          </Typography>
        </Stack>

        <Stack alignItems="center">
          <Box sx={{ width: { xs: '80%', sm: '40%', md: '25%' } }}>
            <ArtistCard />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

function ArtistCard() {
  return (
    <Stack sx={{ color: 'common.white' }}>
      <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Image
          src="/assets/images/portrait/artist_photo.jpg"
          alt="Mary Jenkin"
          ratio="3/4"
        />
      </Box>

      <Stack spacing={0.5} sx={{ mt: 2.5, textAlign: 'center' }}>
        <Typography variant="h6">Mary Jenkin</Typography>
        <Typography variant="body2" sx={{ color: 'grey.400' }}>
          Creator
        </Typography>
      </Stack>
    </Stack>
  );
}
