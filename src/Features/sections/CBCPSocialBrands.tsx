import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';

import Iconify from '../../components/iconify';
import { MotionViewport, varFade } from '../../components/animate';
import Carousel, { useCarousel } from '../../components/carousel';
import { useResponsive } from '../../hooks/use-responsive';

const SOCIALS = [
  { id: '1', name: 'Instagram', icon: 'mdi:instagram' },
  { id: '2', name: 'TikTok', icon: 'ic:baseline-tiktok' },
  { id: '3', name: 'Etsy', icon: 'simple-icons:etsy' },
  { id: '4', name: 'Pinterest', icon: 'mdi:pinterest' },
  { id: '5', name: 'Facebook', icon: 'mdi:facebook' },
  { id: '6', name: 'Twitter / X', icon: 'ri:twitter-x-fill' },
];

const ITEMS = [...SOCIALS, ...SOCIALS, ...SOCIALS];

export default function CBCPSocialBrands() {
  const lgUp = useResponsive('up', 'lg');
  const mdUp = useResponsive('up', 'md');
  const smUp = useResponsive('up', 'sm');

  // See CBCPLatestArt for why slidesToShow is computed here rather than
  // via react-slick's own `responsive` breakpoints.
  const slidesToShow = lgUp ? 8 : mdUp ? 6 : smUp ? 4 : 3;

  const carousel = useCarousel({
    infinite: true,
    autoplay: true,
    autoplaySpeed: 0,
    speed: 2000,
    cssEase: 'linear',
    slidesToShow,
    slidesToScroll: 1,
    pauseOnHover: false,
  });

  return (
    <Container component={MotionViewport} sx={{ pt: { xs: 5, md: 10 } }}>
      {/*
        Simple fade rather than slide/zoom — this ticker is already
        continuously autoplay-scrolling, so a slide-in or scale-in on top
        of that motion would read as busy rather than a clean reveal.
      */}
      <Box component={m.div} variants={varFade().in}>
        <Carousel ref={carousel.carouselRef} {...carousel.carouselSettings}>
          {ITEMS.map((social, index) => (
            <Box key={index} sx={{ px: 4, textAlign: 'center' }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={1.5}
                sx={{ color: 'text.disabled', display: 'inline-flex' }}
              >
                <Iconify icon={social.icon} width={28} />
                <Box
                  component="span"
                  sx={{ typography: 'body2', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  {social.name}
                </Box>
              </Stack>
            </Box>
          ))}
        </Carousel>
      </Box>
    </Container>
  );
}
