import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';

import Iconify from '../../components/iconify';
import Carousel, { useCarousel } from '../../components/carousel';

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
  const theme = useTheme();

  const carousel = useCarousel({
    infinite: true,
    autoplay: true,
    autoplaySpeed: 0,
    speed: 2000,
    cssEase: 'linear',
    slidesToShow: 8,
    slidesToScroll: 1,
    pauseOnHover: false,
    responsive: [
      { breakpoint: theme.breakpoints.values.lg, settings: { slidesToShow: 6 } },
      { breakpoint: theme.breakpoints.values.md, settings: { slidesToShow: 4 } },
      { breakpoint: theme.breakpoints.values.sm, settings: { slidesToShow: 3 } },
    ],
  });

  return (
    <Container sx={{ pt: { xs: 5, md: 10 } }}>
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
    </Container>
  );
}
