import { useEffect } from 'react';

import Box from '@mui/material/Box';
import { alpha, styled, useTheme } from '@mui/material/styles';

import Image from '../image';
import { bgGradient } from '../../Theme/css';
import Lightbox, { useLightbox } from '../lightbox';
import Carousel, { useCarousel, CarouselArrows } from '../carousel';
import { contentfulImage } from '../../lib/contentful';

const THUMB_SIZE = 56;

const StyledThumbnailsContainer = styled('div')<{ length: number }>(({ length, theme }) => ({
  position: 'relative',
  margin: theme.spacing(0, 'auto'),
  '& .slick-slide': { lineHeight: 0 },

  ...(length === 1 && { maxWidth: THUMB_SIZE * 1 + 16 }),
  ...(length === 2 && { maxWidth: THUMB_SIZE * 2 + 32 }),
  ...((length === 3 || length === 4) && { maxWidth: THUMB_SIZE * 3 + 48 }),
  ...(length >= 5 && { maxWidth: THUMB_SIZE * 5 }),

  ...(length > 3 && {
    '&:before, &:after': {
      ...bgGradient({
        direction: 'to left',
        startColor: `${alpha(theme.palette.common.black, 0)} 0%`,
        endColor: `${theme.palette.common.black} 100%`,
      }),
      top: 0,
      zIndex: 9,
      content: "''",
      height: '100%',
      position: 'absolute',
      width: (THUMB_SIZE * 2) / 3,
    },
    '&:after': { right: 0, transform: 'scaleX(-1)' },
  }),
}));

type Props = {
  title: string;
  images: string[];
};

export default function ArtworkModalCarousel({ title, images }: Props) {
  const theme = useTheme();

  // The lightbox is for looking closely, so it gets a bigger render than
  // the carousel below; both are still a fraction of the original upload.
  const slides = images.map((src) => ({ src: contentfulImage(src, 2400) }));
  const lightbox = useLightbox(slides);

  const carouselLarge = useCarousel({ draggable: false, adaptiveHeight: true });
  const carouselThumb = useCarousel({
    centerMode: true,
    swipeToSlide: true,
    focusOnSelect: true,
    variableWidth: true,
    centerPadding: '0px',
    slidesToShow: images.length > 3 ? 3 : images.length,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    carouselLarge.onSetNav();
    carouselThumb.onSetNav();
  }, []);

  useEffect(() => {
    if (lightbox.open) carouselLarge.onTogo(lightbox.selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox.open, lightbox.selected]);

  return (
    <Box
      sx={{
        width: { md: '55%' },
        flexShrink: 0,
        bgcolor: 'common.black',
        '& .slick-slide': { float: theme.direction === 'rtl' ? 'right' : 'left' },
      }}
    >
      <CarouselArrows
        onNext={images.length > 1 ? carouselThumb.onNext : undefined}
        onPrev={images.length > 1 ? carouselThumb.onPrev : undefined}
      >
        <Carousel {...carouselLarge.carouselSettings} asNavFor={carouselThumb.nav} ref={carouselLarge.carouselRef}>
          {images.map((src, index) => (
            <Image
              key={src}
              alt={title}
              src={contentfulImage(src, 1200)}
              ratio="1/1"
              onClick={() => lightbox.onOpen(slides[index].src)}
              sx={{ cursor: 'zoom-in' }}
            />
          ))}
        </Carousel>
      </CarouselArrows>

      {images.length > 1 && (
        <StyledThumbnailsContainer length={images.length}>
          <Box sx={{ py: 1.5 }}>
            <Carousel {...carouselThumb.carouselSettings} asNavFor={carouselLarge.nav} ref={carouselThumb.carouselRef}>
              {images.map((src, index) => (
                <Box key={src} sx={{ px: 0.5 }}>
                  <Box
                    component="img"
                    alt={`${title} ${index + 1}`}
                    src={contentfulImage(src, THUMB_SIZE * 2, { square: true })}
                    sx={{
                      width: THUMB_SIZE,
                      height: THUMB_SIZE,
                      borderRadius: 1,
                      objectFit: 'cover',
                      cursor: 'pointer',
                      opacity: carouselLarge.currentIndex === index ? 1 : 0.48,
                      border: '2px solid',
                      borderColor: carouselLarge.currentIndex === index ? 'primary.main' : 'transparent',
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                </Box>
              ))}
            </Carousel>
          </Box>
        </StyledThumbnailsContainer>
      )}

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
        onGetCurrentIndex={(index) => lightbox.setSelected(index)}
      />
    </Box>
  );
}
