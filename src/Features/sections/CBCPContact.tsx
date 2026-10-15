import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { inputBaseClasses } from '@mui/material/InputBase';
import { inputLabelClasses } from '@mui/material/InputLabel';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { TextFieldProps } from '@mui/material/TextField';

import Iconify from '../../components/iconify';
import { bgGradient } from '../../Theme/css';
import { MotionViewport, varFade, varTranEnter } from '../../components/animate';
import { ETSY_SHOP_URL } from '../../lib/links';

const StyledInput = styled((props: TextFieldProps) => <TextField fullWidth {...props} />)(
  ({ theme }) => ({
    [`& .${inputBaseClasses.input}`]: { color: theme.palette.text.primary },
    [`& .${inputLabelClasses.root}.${inputLabelClasses.shrink}`]: {
      color: theme.palette.grey[500],
      [`&.${inputLabelClasses.focused}`]: { color: theme.palette.grey[500] },
    },
  })
);

export default function CBCPContact() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.grey[900], 0.1),
          imgUrl: '/assets/images/marketing/marketing_get_free_seo.jpg',
        }),
        overflow: 'hidden',
        py: { xs: 10, md: 15 },
      }}
    >
      <Container component={MotionViewport}>
        <Box
          sx={{
            display: { md: 'flex' },
            gap: 3,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ width: { md: '42%' } }}>
            <Box component={m.div} variants={varFade().inLeft}>
              <Typography
                variant="h1"
                component="h2"
                sx={{
                  color: 'primary.main',
                  mb: { xs: 3, md: 8 },
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >
                Get In
                <br /> Touch
              </Typography>
            </Box>

            <Stack
              component={m.div}
              variants={varFade().inLeft}
              direction="row"
              alignItems="center"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ color: 'common.white', mb: 2 }}
            >
              <Iconify icon="carbon:email" width={24} sx={{ mr: 2 }} />
              <Link color="inherit" href="mailto:creepybutcutepress@gmail.com">
                creepybutcutepress@gmail.com
              </Link>
            </Stack>

            <Stack
              component={m.div}
              variants={varFade().inLeft}
              direction="row"
              alignItems="center"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ color: 'common.white', mb: 2 }}
            >
              <Iconify icon="mdi:instagram" width={24} sx={{ mr: 2 }} />
              <Link color="inherit" href="https://instagram.com/creepybutcutepress" target="_blank">
                @creepybutcutepress
              </Link>
            </Stack>

            <Stack
              component={m.div}
              variants={varFade().inLeft}
              direction="row"
              alignItems="center"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ color: 'common.white' }}
            >
              <Iconify icon="simple-icons:etsy" width={24} sx={{ mr: 2 }} />
              <Link color="inherit" href={ETSY_SHOP_URL} target="_blank" rel="noopener">
                etsy.com/shop/creepybutcutepress
              </Link>
            </Stack>
          </Box>

          <Box sx={{ width: { md: '42%' } }}>
            <Stack alignItems={{ xs: 'center', md: 'flex-start' }}>
              {/*
                Left column animates in first; each field here then slides
                in from the right a little later than the one above it —
                same staggered-by-row pattern as the About section's stats.
              */}
              <Box
                component={m.div}
                variants={varFade().inRight}
                transition={{ ...varTranEnter(), delay: 0.3 }}
                sx={{ width: 1, mb: 2.5 }}
              >
                <StyledInput label="Name" />
              </Box>
              <Box
                component={m.div}
                variants={varFade().inRight}
                transition={{ ...varTranEnter(), delay: 0.45 }}
                sx={{ width: 1, mb: 2.5 }}
              >
                <StyledInput label="Email" />
              </Box>
              <Box
                component={m.div}
                variants={varFade().inRight}
                transition={{ ...varTranEnter(), delay: 0.6 }}
                sx={{ width: 1, mb: 5 }}
              >
                <StyledInput label="Message" multiline rows={3} />
              </Box>
              <Box
                component={m.div}
                variants={varFade().inRight}
                transition={{ ...varTranEnter(), delay: 0.75 }}
              >
                <Button size="large" variant="contained" color="primary">
                  Send Message
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
