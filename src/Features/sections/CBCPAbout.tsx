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

const STATS = [
  {
    label: 'Pieces Sold',
    total: 500,
    content: 'Original works, prints, stickers and merch shipped to collectors worldwide.',
  },
  {
    label: 'Followers',
    total: 12000,
    content: 'A growing community of fans who love the strange and the beautifully unsettling.',
  },
  {
    label: 'Years Creating',
    total: 10,
    content: 'A decade of honing a singular artistic voice that blends cute with creepy.',
  },
];

export default function CBCPAbout() {
  return (
    <Container sx={{ py: { xs: 5, md: 10 } }}>
      <Image
        alt="Creepy But Cute Press artwork"
        src="/assets/images/marketing/marketing_post_hero.jpg"
        ratio="16/9"
        sx={{ borderRadius: 1.5, mb: { xs: 5, md: 10 } }}
      />

      <Box
        sx={{
          display: { md: 'flex' },
          columnGap: 3,
          justifyContent: 'space-between',
          rowGap: { xs: 5, md: 0 },
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box sx={{ width: { md: '42%' }, textAlign: { xs: 'center', md: 'right' } }}>
          <Typography component="div" variant="overline" sx={{ color: 'text.disabled' }}>
            About the Artist
          </Typography>

          <Typography variant="h2" sx={{ my: 3 }}>
            The Mind Behind the Madness
          </Typography>

          <Typography sx={{ color: 'text.secondary' }}>
            Creepy But Cute Press is the creative outlet of Mary Jenkin — an artist drawn to the
            peculiar, the strange, and the beautifully unsettling. From creepy-styled fan art to
            wholly original pieces, every work is designed to make you look twice. Expect characters
            that haunt your dreams in the best possible way — weird, wonderful, and unlike anything
            else you'll find.
          </Typography>

          <Button
            component={RouterLink}
            href="/about"
            size="large"
            color="inherit"
            endIcon={<Iconify icon="carbon:chevron-right" />}
            sx={{ my: 5 }}
          >
            Learn More
          </Button>
        </Box>

        <Box sx={{ width: { md: '52%' } }}>
          <Stack spacing={5}>
            {STATS.map((row) => (
              <Stack
                key={row.label}
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
