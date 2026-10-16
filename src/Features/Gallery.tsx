import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { motion as m } from 'framer-motion';

import Image from '../components/image';
import BackToTop from '../components/back-to-top';
import { RouterLink } from '../components/RouterLink';
import ArtworkModal from '../components/artwork-modal';
import { varHover, varTranHover, MotionViewport, varZoom } from '../components/animate';
import { useResponsive } from '../hooks/use-responsive';
import { useArtworks, useCategories } from '../hooks/queries/content';
import { type ArtItem, type Category } from '../lib/contentful';
import { PIECE_PARAM, galleryPieceHref } from '../lib/galleryLink';

// Flat display order for the gallery's tabs — Prints and Artist Books are
// kept adjacent (even though Artist Books is a Prints subcategory in
// Contentful) since they're closely related; anything else sorts after
// these, alphabetically.
const TAB_ORDER = ['Prints', 'Artist Books', 'Drawings', 'Commissions'];

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const ai = TAB_ORDER.indexOf(a.name);
    const bi = TAB_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

const NO_ARTWORKS: ArtItem[] = [];

export default function Gallery() {
  const categoriesQuery = useCategories();
  const artworksQuery = useArtworks();
  const categories = useMemo(() => sortCategories(categoriesQuery.data ?? []), [categoriesQuery.data]);
  const artworks = artworksQuery.data ?? NO_ARTWORKS;
  const loading = categoriesQuery.isPending || artworksQuery.isPending;

  const [searchParams, setSearchParams] = useSearchParams();
  const openPieceId = searchParams.get(PIECE_PARAM);
  // The piece in the URL when the page first opened (e.g. a home page card
  // linking straight to it) - read once, so opening/closing pieces later
  // doesn't move the default tab.
  const [initialPieceId] = useState(openPieceId);

  // Default to the Prints tab - unless we're deep-linking straight to a
  // piece, in which case show whichever tab that piece actually lives in
  // so the grid behind the modal matches what's open. Picking a tab
  // replaces the default.
  const [chosenTab, setTopTab] = useState('');
  const defaultTab = useMemo(() => {
    const piece = artworks.find((a) => a.id === initialPieceId);
    const printsCategory = categories.find((c) => c.name === 'Prints');
    return piece?.categoryIds?.[0] ?? printsCategory?.id ?? categories[0]?.id ?? '';
  }, [artworks, categories, initialPieceId]);
  const topTab = chosenTab || defaultTab;
  const openPiece = artworks.find((a) => a.id === openPieceId) ?? null;

  const closeModal = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PIECE_PARAM);
        return next;
      },
      { replace: true }
    );
  };

  const filtered = useMemo(
    () => artworks.filter((item) => item.categoryIds?.includes(topTab)),
    [artworks, topTab]
  );

  const handleTopTab = (_: React.SyntheticEvent, value: string) => {
    setTopTab(value);
  };

  return (
    <Container sx={{ py: { xs: 5, md: 10 } }}>
      <Stack spacing={3} sx={{ textAlign: { xs: 'center', md: 'unset' }, mb: { xs: 5, md: 8 } }}>
        <Typography variant="overline" sx={{ color: 'text.disabled' }}>
          Our Work
        </Typography>
        <Typography variant="h2">Gallery</Typography>
      </Stack>

      <Tabs
        value={topTab}
        onChange={handleTopTab}
        scrollButtons="auto"
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 4 }}
      >
        {categories.map((cat) => (
          <Tab key={cat.id} value={cat.id} label={cat.name} />
        ))}
      </Tabs>

      {!loading && filtered.length === 0 && (
        <Typography sx={{ color: 'text.secondary', py: 10, textAlign: 'center' }}>
          No pieces in this category yet.
        </Typography>
      )}

      <Box
        sx={{
          gap: 3,
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
        }}
      >
        {filtered.map((item) => (
          <GalleryItem key={item.id} item={item} />
        ))}
      </Box>

      <ArtworkModal item={openPiece} open={Boolean(openPiece)} onClose={closeModal} />

      <BackToTop />
    </Container>
  );
}

function GalleryItem({ item }: { item: ArtItem }) {
  const theme = useTheme();
  const mdUp = useResponsive('up', 'md');

  return (
    // Each item gets its own MotionViewport (rather than one shared by the
    // whole grid) so it reveals based on its own scroll position — a
    // single viewport covering the entire grid would fire as soon as the
    // first row is visible, leaving every row below it already fully
    // animated in by the time the user actually scrolls down to them (see
    // the same bug in CBCPAbout's git history for the long version).
    <MotionViewport>
      {/*
        The scroll-reveal variant lives on this wrapper, not on the Paper
        below — the Paper's `layoutId` makes it part of the shared-element
        FLIP transition into the artwork modal, and that layout-projection
        system fights with (and wins over) a `variants`-driven opacity/
        scale on the *same* element, so it just renders fully visible
        regardless of scroll position. Keeping them on separate elements
        lets both animations run independently.
      */}
      <m.div variants={varZoom().in}>
        <Link component={RouterLink} href={galleryPieceHref(item.id)}>
          <Paper
            component={m.div}
            layoutId={`artwork-${item.id}`}
            whileHover="hover"
            sx={{ position: 'relative', cursor: 'pointer', borderRadius: 2, overflow: 'hidden' }}
          >
            <Stack
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{
                width: 1,
                height: 1,
                zIndex: 9,
                position: 'absolute',
                color: 'common.white',
                textAlign: 'center',
                px: 2,
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.72 }}>
                {item.category}
              </Typography>
              <Typography variant="h6">{item.title}</Typography>
            </Stack>

            <m.div variants={varHover(1.1)} transition={varTranHover()}>
              <Image
                alt={item.title}
                src={item.coverUrl}
                ratio={mdUp ? '3/4' : '1/1'}
                overlay={alpha(theme.palette.grey[900], 0.48)}
                // Source photos are flat-lay shots with a wood backdrop
                // around the art — cropping into a non-matching ratio can
                // leave slivers of that backdrop visible at the edges. A
                // slight zoom (clipped by this Paper's own overflow:
                // hidden) crops that margin out — same fix as
                // CBCPArtwork's SmallItem.
                sx={{ transform: 'scale(1.15)' }}
              />
            </m.div>
          </Paper>
        </Link>
      </m.div>
    </MotionViewport>
  );
}
