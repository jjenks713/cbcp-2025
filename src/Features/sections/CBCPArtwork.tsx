import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { alpha, useTheme } from '@mui/material/styles';

import Image from '../../components/image';
import Iconify from '../../components/iconify';
import TextMaxLine from '../../components/text-max-line';
import { RouterLink } from '../../components/RouterLink';
import { varHover, varTranHover } from '../../components/animate';
import { useResponsive } from '../../hooks/use-responsive';

type ArtItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  coverUrl: string;
};

const ART_ITEMS: ArtItem[] = [
  { id: '1', title: 'Midnight Garden', category: 'Screen Printing', description: 'A hauntingly lush garden scene hand-pulled in three colors on 100lb paper.', coverUrl: '/assets/images/marketing/marketing_1.jpg' },
  { id: '2', title: 'Sweet Nightmares', category: 'Painting', description: 'Original acrylic piece exploring the boundary between comfort and dread.', coverUrl: '/assets/images/marketing/marketing_2.jpg' },
  { id: '3', title: 'Cursed Cutie', category: 'Drawing', description: 'Detailed ink illustration — a familiar face made beautifully strange.', coverUrl: '/assets/images/marketing/marketing_3.jpg' },
  { id: '4', title: 'Ghoulish Garden', category: 'Sticker Making', description: 'A full sticker sheet of garden creatures with an unsettling twist.', coverUrl: '/assets/images/marketing/marketing_4.jpg' },
  { id: '5', title: 'Hollow Haze', category: 'Painting', description: 'Soft edges and deep shadows in this moody mixed-media original.', coverUrl: '/assets/images/marketing/marketing_5.jpg' },
  { id: '6', title: 'Wicked Whimsy', category: 'Screen Printing', description: 'Limited-edition two-color print — only 50 in existence.', coverUrl: '/assets/images/marketing/marketing_6.jpg' },
];

export default function CBCPArtwork() {
  const mdUp = useResponsive('up', 'md');

  return (
    <Container sx={{ overflow: 'hidden', pt: { xs: 5, md: 10 }, pb: 10 }}>
      <Stack spacing={3} sx={{ textAlign: { xs: 'center', md: 'unset' } }}>
        <Typography variant="overline" sx={{ color: 'text.disabled' }}>Our Work</Typography>
        <Typography variant="h2">The Art</Typography>
      </Stack>

      <Grid container spacing={3} alignItems="center" sx={{ py: { xs: 8, md: 10 } }}>
        {/* Left tall column */}
        <Grid size={{ xs: 6, md: 2 }}>
          <SmallItem item={ART_ITEMS[0]} />
        </Grid>

        {/* Center mosaic */}
        <Grid container size={{ xs: 12, md: 8 }}>
          <Grid size={{ xs: 6, md: 9 }}>
            {mdUp ? <LargeItem item={ART_ITEMS[1]} /> : <SmallItem item={ART_ITEMS[1]} square />}
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Stack justifyContent={{ md: 'flex-end' }} sx={{ height: { md: 1 } }}>
              <SmallItem item={ART_ITEMS[2]} square />
            </Stack>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SmallItem item={ART_ITEMS[3]} square />
          </Grid>
          <Grid size={{ xs: 6, md: 9 }}>
            {mdUp ? <LargeItem item={ART_ITEMS[4]} /> : <SmallItem item={ART_ITEMS[4]} square />}
          </Grid>
        </Grid>

        {/* Right tall column — desktop only */}
        {mdUp && (
          <Grid size={{ xs: 6, md: 2 }}>
            <SmallItem item={ART_ITEMS[5]} />
          </Grid>
        )}
      </Grid>

      <Stack alignItems={{ xs: 'center', md: 'flex-end' }}>
        <Button
          component={RouterLink}
          href="/gallery"
          size="large"
          color="inherit"
          endIcon={<Iconify icon="carbon:chevron-right" />}
        >
          View All
        </Button>
      </Stack>
    </Container>
  );
}

function LargeItem({ item }: { item: ArtItem }) {
  return (
    <Paper
      sx={{
        display: 'grid',
        borderRadius: 2,
        boxShadow: '0 24px 48px 0 rgba(0,0,0,0.20)',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
      }}
    >
      <Box sx={{ p: 0.75 }}>
        <Image alt="artwork" src={item.coverUrl} ratio="3/4" sx={{ borderRadius: 2 }} />
      </Box>
      <Stack alignItems="flex-end" justifyContent="space-between" sx={{ p: 3, pt: 5, height: 1 }}>
        <div>
          <Typography variant="overline" sx={{ color: 'primary.main' }}>{item.category}</Typography>
          <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>{item.title}</Typography>
          <TextMaxLine variant="body2" sx={{ color: 'text.secondary' }}>{item.description}</TextMaxLine>
        </div>
        <Button
          component={RouterLink}
          href="/gallery"
          size="small"
          color="inherit"
          endIcon={<Iconify icon="carbon:chevron-right" />}
        >
          View Piece
        </Button>
      </Stack>
    </Paper>
  );
}

function SmallItem({ item, square }: { item: ArtItem; square?: boolean }) {
  const theme = useTheme();
  const mdUp = useResponsive('up', 'md');

  return (
    <Link component={RouterLink} href="/gallery">
      <Paper
        component={m.div}
        whileHover="hover"
        sx={{ position: 'relative', cursor: 'pointer', borderRadius: 2, overflow: 'hidden' }}
      >
        <Stack
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{
            width: 1, height: 1, zIndex: 9, position: 'absolute',
            color: 'common.white', textAlign: 'center',
          }}
        >
          <Typography variant="overline" sx={{ opacity: 0.48 }}>{item.category}</Typography>
          <Typography variant="h6">{item.title}</Typography>
        </Stack>

        <m.div variants={varHover(1.25)} transition={varTranHover()}>
          <Image
            alt="artwork"
            src={item.coverUrl}
            ratio={(square && '1/1') || (mdUp && '3/4') || '1/1'}
            overlay={alpha(theme.palette.grey[900], 0.48)}
          />
        </m.div>
      </Paper>
    </Link>
  );
}
