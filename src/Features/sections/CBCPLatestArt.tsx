import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import Iconify from '../../components/iconify';
import { RouterLink } from '../../components/RouterLink';
import Carousel, { useCarousel, CarouselDots, CarouselArrows } from '../../components/carousel';
import { useTheme } from '@mui/material/styles';
import { useResponsive } from '../../hooks/use-responsive';
import { useContentfulList } from '../../hooks/useContentfulData';
import { getArtworks, type ArtItem as ArtItemData } from '../../lib/contentful';
import { galleryPieceHref } from '../../lib/galleryLink';

export default function CBCPLatestArt() {
  const theme = useTheme();
  const mdUp = useResponsive('up', 'md');
  const ART_ITEMS = useContentfulList(() => getArtworks({ featuredOnly: true }), [] as ArtItemData[]);

  const carousel = useCarousel({
    slidesToShow: 3,
    slidesToScroll: 1,
    ...CarouselDots({ sx: { mt: 5 } }),
    responsive: [
      { breakpoint: theme.breakpoints.values.md, settings: { slidesToShow: 2 } },
      { breakpoint: theme.breakpoints.values.sm, settings: { slidesToShow: 1 } },
    ],
  });

  const viewAllBtn = (
    <Button
      component={RouterLink}
      href="/gallery"
      endIcon={<Iconify icon="carbon:chevron-right" />}
    >
      View Gallery
    </Button>
  );

  // Still loading (or nothing has been marked featured in Contentful yet) —
  // skip rendering an empty carousel under the heading.
  if (ART_ITEMS.length === 0) return null;

  return (
    <Container sx={{ py: { xs: 8, md: 15 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={{ xs: 'center', md: 'space-between' }}
        sx={{ mb: 5 }}
      >
        <Typography variant="h3">Featured Artwork</Typography>
        {mdUp && viewAllBtn}
      </Stack>

      {/* Negative margin expands track beyond container; slick-slide padding creates the visible gap */}
      <Box
        sx={{
          mx: { xs: -2, md: -3 },
          '& .slick-slide > div': { px: { xs: 2, md: 3 } },
        }}
      >
        <CarouselArrows
          onNext={carousel.onNext}
          onPrev={carousel.onPrev}
          leftButtonProps={{ sx: { left: { xs: 8, md: 8 } } }}
          rightButtonProps={{ sx: { right: { xs: 8, md: 8 } } }}
        >
          <Carousel ref={carousel.carouselRef} {...carousel.carouselSettings}>
            {ART_ITEMS.map((item) => (
              <ArtItem key={item.id} item={item} />
            ))}
          </Carousel>
        </CarouselArrows>
      </Box>

      {!mdUp && (
        <Stack alignItems="center" sx={{ mt: 5 }}>
          {viewAllBtn}
        </Stack>
      )}
    </Container>
  );
}

function ArtItem({ item }: { item: ArtItemData }) {
  return (
    <Box
      component={RouterLink}
      href={galleryPieceHref(item.id)}
      sx={{
        display: 'block',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        height: 280,
        boxShadow: 8,
        cursor: 'pointer',
        '&:hover img': { transform: 'scale(1.07)', transition: 'transform 0.3s ease' },
        '& img': { transition: 'transform 0.3s ease' },
      }}
    >
      <Box
        component="img"
        src={item.coverUrl}
        alt={item.title}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 55%)',
        }}
      />

      {/* Text */}
      <Stack
        justifyContent="flex-end"
        sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          p: 2.5,
          zIndex: 2,
          color: 'common.white',
        }}
      >
        <Typography variant="overline" sx={{ opacity: 0.72, lineHeight: 1.5 }}>
          {item.category}
        </Typography>
        <Typography variant="h5" sx={{ color: 'inherit' }}>
          {item.title}
        </Typography>
      </Stack>
    </Box>
  );
}
