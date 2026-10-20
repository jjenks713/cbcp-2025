import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ChevronRight from '@mui/icons-material/ChevronRight';

import { RouterLink } from '../../components/RouterLink';
import { MotionViewport, varFade, varZoom } from '../../components/animate';
import Carousel, { useCarousel, CarouselDots, CarouselArrows } from '../../components/carousel';
import { useResponsive } from '../../hooks/use-responsive';
import { useArtworks } from '../../hooks/queries/content';
import { type ArtItem as ArtItemData, contentfulImage } from '../../lib/contentful';
import { galleryPieceHref } from '../../lib/galleryLink';

export default function CBCPLatestArt() {
  const mdUp = useResponsive('up', 'md');
  const smUp = useResponsive('up', 'sm');
  const ART_ITEMS: ArtItemData[] = useArtworks({ featuredOnly: true }).data ?? [];

  // react-slick's own `responsive` breakpoints only re-check on a media
  // query *change* event — if the page loads already inside the smallest
  // breakpoint (e.g. straight to a phone-width viewport), that event never
  // fires and slidesToShow silently stays at the base value. Computing it
  // via useResponsive (MUI's useMediaQuery) instead is correct on load.
  const slidesToShow = mdUp ? 3 : smUp ? 2 : 1;

  const carousel = useCarousel({
    slidesToShow,
    slidesToScroll: 1,
    ...CarouselDots({ sx: { mt: 5 } }),
  });

  const viewAllBtn = (
    <Button
      component={RouterLink}
      href="/gallery"
      endIcon={<ChevronRight />}
    >
      View Gallery
    </Button>
  );

  // Still loading (or nothing has been marked featured in Contentful yet) —
  // skip rendering an empty carousel under the heading.
  if (ART_ITEMS.length === 0) return null;

  return (
    <Container component={MotionViewport} sx={{ py: { xs: 8, md: 15 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={{ xs: 'center', md: 'space-between' }}
        sx={{ mb: 5 }}
      >
        <Box component={m.div} variants={varFade().inUp}>
          <Typography variant="h3">Featured Artwork</Typography>
        </Box>
        {mdUp && (
          <Box component={m.div} variants={varFade().inUp}>
            {viewAllBtn}
          </Box>
        )}
      </Stack>

      {/* Negative margin expands track beyond container; slick-slide padding creates the visible gap */}
      <Box
        component={m.div}
        variants={varZoom().in}
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
        src={contentfulImage(item.coverUrl, 600)}
        alt={item.title}
        loading="lazy"
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
