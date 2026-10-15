import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import Iconify from '../../components/iconify';

const COLORS = ['primary', 'secondary', 'warning', 'success'] as const;

const STYLES = [
  { name: 'Screen Printing', icon: 'ph:monitor-bold' },
  { name: 'Sticker Making', icon: 'ph:sticker-bold' },
  { name: 'Painting', icon: 'ph:paint-brush-bold' },
  { name: 'Drawing', icon: 'ph:pencil-bold' },
];

export default function CBCPArtStyles() {
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
          Art Styles
        </Typography>

        <Typography variant="h2">The Creative Process</Typography>

        <Typography sx={{ color: 'text.secondary' }}>
          Every medium brings something different to the table. Here's a look at the techniques
          behind the Creepy But Cute Press aesthetic.
        </Typography>
      </Stack>

      <Box
        sx={{
          gap: 4,
          display: 'grid',
          alignItems: 'flex-end',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
        }}
      >
        {STYLES.map((style, index) => (
          <Card
            key={style.name}
            sx={{
              p: 4,
              color: (theme) => (theme.palette[COLORS[index]] as any).darker ?? theme.palette[COLORS[index]].dark,
              bgcolor: (theme) => (theme.palette[COLORS[index]] as any).light ?? theme.palette[COLORS[index]].main + '22',
              boxShadow: (theme) =>
                `-8px 12px 32px 0px ${alpha(theme.palette[COLORS[index]].main, 0.2)}`,
              ...(index === 1 && { mb: { md: 2.5 } }),
              ...(index === 2 && { mb: { md: 5 } }),
              ...(index === 3 && { mb: { md: 7.5 } }),
            }}
          >
            <Iconify icon={style.icon} width={64} sx={{ opacity: 0.48 }} />
            <Typography variant="h5" sx={{ mt: 3, textAlign: 'right' }}>
              {style.name}
            </Typography>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
