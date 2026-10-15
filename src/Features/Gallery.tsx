import { useEffect, useMemo, useState } from 'react';
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
import { RouterLink } from '../components/RouterLink';
import ArtworkModal from '../components/artwork-modal';
import { varHover, varTranHover } from '../components/animate';
import { useResponsive } from '../hooks/use-responsive';
import { getArtworks, getCategoryTree, type ArtItem, type CategoryNode } from '../lib/contentful';
import { PIECE_PARAM, galleryPieceHref } from '../lib/galleryLink';

const ALL = 'all';

export default function Gallery() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [artworks, setArtworks] = useState<ArtItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [topTab, setTopTab] = useState<string>(ALL);
  const [subTab, setSubTab] = useState<string>(ALL);

  const [searchParams, setSearchParams] = useSearchParams();
  const openPieceId = searchParams.get(PIECE_PARAM);
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

  useEffect(() => {
    let active = true;
    Promise.all([getCategoryTree(), getArtworks()]).then(([cats, art]) => {
      if (!active) return;
      setCategories(cats);
      setArtworks(art);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const activeTopNode = categories.find((c) => c.id === topTab);

  const filtered = useMemo(() => {
    if (topTab === ALL) return artworks;

    const idsInScope =
      subTab === ALL
        ? [topTab, ...(activeTopNode?.children.map((c) => c.id) ?? [])]
        : [subTab];

    return artworks.filter((item) => item.categoryIds?.some((id) => idsInScope.includes(id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworks, topTab, subTab]);

  const handleTopTab = (_: React.SyntheticEvent, value: string) => {
    setTopTab(value);
    setSubTab(ALL);
  };

  const handleSubTab = (_: React.SyntheticEvent, value: string) => {
    setSubTab(value);
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
        sx={{ mb: activeTopNode?.children.length ? 1 : 4 }}
      >
        <Tab value={ALL} label="All" />
        {categories.map((cat) => (
          <Tab key={cat.id} value={cat.id} label={cat.name} />
        ))}
      </Tabs>

      {activeTopNode && activeTopNode.children.length > 0 && (
        <Tabs
          value={subTab}
          onChange={handleSubTab}
          scrollButtons="auto"
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            mb: 4,
            minHeight: 36,
            '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: 13 },
          }}
        >
          <Tab value={ALL} label={`All ${activeTopNode.name}`} />
          {activeTopNode.children.map((sub) => (
            <Tab key={sub.id} value={sub.id} label={sub.name} />
          ))}
        </Tabs>
      )}

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
    </Container>
  );
}

function GalleryItem({ item }: { item: ArtItem }) {
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
          />
        </m.div>
      </Paper>
    </Link>
  );
}
