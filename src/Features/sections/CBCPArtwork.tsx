import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { alpha, useTheme } from '@mui/material/styles';

import Image from '../../components/image';
import TextMaxLine from '../../components/text-max-line';
import { RouterLink } from '../../components/RouterLink';
import { varHover, varTranHover, MotionViewport, varFade, varZoom } from '../../components/animate';
import { useResponsive } from '../../hooks/use-responsive';
import { useArtworks } from '../../hooks/queries/content';
import { type ArtItem, contentfulImage } from '../../lib/contentful';
import { galleryPieceHref } from '../../lib/galleryLink';

export default function CBCPArtwork() {
  const mdUp = useResponsive('up', 'md');
  // This mosaic layout indexes ART_ITEMS[0..5] directly, so only render
  // once there are enough Contentful entries to fill all six slots.
  // Shares the gallery's artworks query (same key), so it's one fetch.
  const artworks = useArtworks().data ?? [];
  const ART_ITEMS: ArtItem[] = artworks.length >= 6 ? artworks : [];

  if (ART_ITEMS.length < 6) return null;

  return (
    <Container component={MotionViewport} sx={{ overflow: 'hidden', pt: { xs: 5, md: 10 }, pb: 10 }}>
      <Stack spacing={3} sx={{ textAlign: { xs: 'center', md: 'unset' } }}>
        <Box component={m.div} variants={varFade().inUp}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>Our Work</Typography>
        </Box>
        <Box component={m.div} variants={varFade().inUp}>
          <Typography variant="h2">The Art</Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} alignItems="center" sx={{ py: { xs: 8, md: 10 } }}>
        {/* Left tall column */}
        <Grid component={m.div} variants={varZoom().in} size={{ xs: 6, md: 2 }}>
          <SmallItem item={ART_ITEMS[0]} />
        </Grid>

        {/* Center mosaic */}
        <Grid container spacing={3} size={{ xs: 12, md: 8 }}>
          <Grid component={m.div} variants={varZoom().in} size={{ xs: 6, md: 9 }}>
            {mdUp ? <LargeItem item={ART_ITEMS[1]} /> : <SmallItem item={ART_ITEMS[1]} square />}
          </Grid>
          <Grid component={m.div} variants={varZoom().in} size={{ xs: 6, md: 3 }}>
            <Stack justifyContent={{ md: 'flex-end' }} sx={{ height: { md: 1 } }}>
              <SmallItem item={ART_ITEMS[2]} square />
            </Stack>
          </Grid>
          <Grid component={m.div} variants={varZoom().in} size={{ xs: 6, md: 3 }}>
            <SmallItem item={ART_ITEMS[3]} square />
          </Grid>
          <Grid component={m.div} variants={varZoom().in} size={{ xs: 6, md: 9 }}>
            {mdUp ? <LargeItem item={ART_ITEMS[4]} /> : <SmallItem item={ART_ITEMS[4]} square />}
          </Grid>
        </Grid>

        {/* Right tall column — desktop only */}
        {mdUp && (
          <Grid component={m.div} variants={varZoom().in} size={{ xs: 6, md: 2 }}>
            <SmallItem item={ART_ITEMS[5]} />
          </Grid>
        )}
      </Grid>

      <Stack component={m.div} variants={varFade().inUp} alignItems={{ xs: 'center', md: 'flex-end' }}>
        <Button
          component={RouterLink}
          href="/gallery"
          size="large"
          sx={{ color: 'common.white' }}
          endIcon={<ChevronRight />}
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
        bgcolor: 'background.default',
        boxShadow: '0 24px 48px 0 rgba(0,0,0,0.20)',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
      }}
    >
      <Box sx={{ p: 0.75, display: 'flex', alignItems: 'center' }}>
        <Image alt="artwork" src={contentfulImage(item.coverUrl, 800)} ratio="3/4" sx={{ borderRadius: 2 }} />
      </Box>
      {/*
        No height: 1 / justifyContent: space-between here — the image's
        3/4 ratio makes its column fairly short at a 2-up width, and a
        fixed-height text column (forced to match it) would overflow
        and spill the button out below the card whenever title +
        description need more room than that. Sizing naturally and
        letting the grid row grow to fit keeps everything inside.
      */}
      <Stack alignItems="flex-end" spacing={2} sx={{ p: 3, pt: 5, textAlign: 'right' }}>
        <div>
          <Typography variant="overline" sx={{ color: 'primary.main' }}>{item.category}</Typography>
          <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>{item.title}</Typography>
          <TextMaxLine variant="body2" sx={{ color: 'text.secondary' }}>{item.description}</TextMaxLine>
        </div>
        {/*
          endIcon would count toward the button's own width, pulling its
          text left of where the title's text ends. Positioning the icon
          absolutely takes it out of that layout box entirely — the
          button's box (and so its text) is exactly as wide as "View
          Piece", and the chevron just floats past its right edge.
        */}
        <Button
          component={RouterLink}
          href={galleryPieceHref(item.id)}
          size="small"
          color="inherit"
          variant={"text"}
          sx={{ pr: 0, minWidth: 0, position: 'relative' }}
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
    <Link component={RouterLink} href={galleryPieceHref(item.id)}>
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
            src={contentfulImage(item.coverUrl, 800)}
            ratio={(square && '1/1') || (mdUp && '3/4') || '1/1'}
            overlay={alpha(theme.palette.grey[900], 0.48)}
            // Source photos are flat-lay shots with a wood backdrop around
            // the art — cropping a landscape photo into a square/portrait
            // frame can leave slivers of that backdrop visible at the
            // edges. A slight zoom (clipped by this Paper's own
            // overflow: hidden) crops that margin out.
            sx={{ transform: 'scale(1.15)' }}
          />
        </m.div>
      </Paper>
    </Link>
  );
}
