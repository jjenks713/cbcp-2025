import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { MotionViewport, varFade, varZoom } from '../../components/animate';
import Carousel, { useCarousel, CarouselDots, CarouselArrows } from '../../components/carousel';

const TESTIMONIALS = [
  {
    id: '1',
    review: "Mary's art is unlike anything I've ever owned. My \"Sweet Nightmares\" print stops everyone who walks into my apartment — it's creepy, it's beautiful, and it's completely unforgettable.",
    name: 'Alex T.',
    avatarUrl: '/assets/images/portrait/portrait_2.jpg',
  },
  {
    id: '2',
    review: "The stickers are absolutely perfect quality. Die-cut, waterproof, and the designs are just *chef's kiss*. I've ordered from CBCP three times now and I'll keep coming back.",
    name: 'Jordan M.',
    avatarUrl: '/assets/images/portrait/portrait_3.jpg',
  },
  {
    id: '3',
    review: "I commissioned a custom piece and it exceeded every expectation. Mary really listens to what you want and brings something extra to it. The detail and personality in the work is incredible.",
    name: 'Sam K.',
    avatarUrl: '/assets/images/portrait/portrait_4.jpg',
  },
  {
    id: '4',
    review: "Creepy But Cute Press nails the aesthetic perfectly. Strange, beautiful, and totally unique. I've gifted CBCP prints to three different friends and they all loved them.",
    name: 'Riley P.',
    avatarUrl: '/assets/images/portrait/portrait_5.jpg',
  },
];

export default function CBCPTestimonials() {
  const carousel = useCarousel({
    autoplay: true,
    autoplaySpeed: 5000,
    slidesToShow: 1,
    slidesToScroll: 1,
    // Testimonial content is much taller stacked in a column (mobile) than
    // side-by-side (desktop) — without this the slide track keeps the
    // shorter desktop-measured height and clips/overlaps the mobile layout.
    adaptiveHeight: true,
    ...CarouselDots({ sx: { mt: { xs: 8, md: 10 } } }),
  });

  return (
    <Box sx={{ bgcolor: 'background.neutral', overflow: 'hidden' }}>
      <Container component={MotionViewport} sx={{ position: 'relative', py: { xs: 10, md: 15 } }}>
        <Stack spacing={2} sx={{ textAlign: 'center', mb: { xs: 8, md: 10 } }}>
          <Box component={m.div} variants={varFade().inUp}>
            <Typography variant="overline" sx={{ color: 'text.disabled' }}>
              Testimonials
            </Typography>
          </Box>
          <Box component={m.div} variants={varFade().inUp}>
            <Typography variant="h2">People Who Love Our Work</Typography>
          </Box>
        </Stack>

        <CarouselArrows
          onNext={carousel.onNext}
          onPrev={carousel.onPrev}
          leftButtonProps={{ sx: { opacity: { xs: 0, md: 1 } } }}
          rightButtonProps={{ sx: { opacity: { xs: 0, md: 1 } } }}
        >
          <Box component={m.div} variants={varZoom().in} sx={{ width: 1, maxWidth: 800, mx: 'auto' }}>
            <Carousel ref={carousel.carouselRef} {...carousel.carouselSettings}>
              {TESTIMONIALS.map((t) => (
                <TestimonialItem key={t.id} testimonial={t} />
              ))}
            </Carousel>
          </Box>
        </CarouselArrows>
      </Container>
    </Box>
  );
}

function TestimonialItem({ testimonial }: { testimonial: typeof TESTIMONIALS[number] }) {
  return (
    <Stack
      spacing={{ xs: 5, md: 10 }}
      direction={{ xs: 'column', md: 'row' }}
    >
      <Typography sx={{ fontSize: { md: 20 }, lineHeight: 1.75, textAlign: { xs: 'center', md: 'left' } }}>
        {testimonial.review}
      </Typography>

      <Stack sx={{ flexShrink: 0, textAlign: 'center' }}>
        <Avatar
          alt={testimonial.name}
          src={testimonial.avatarUrl}
          sx={{ width: 96, height: 96, mx: 'auto' }}
        />
        <Typography variant="h6" sx={{ mt: 2.5 }}>
          {testimonial.name}
        </Typography>
      </Stack>
    </Stack>
  );
}
