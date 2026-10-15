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
      <Container>
        <Box
          sx={{
            display: { md: 'flex' },
            gap: 3,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ width: { md: '42%' } }}>
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

            <Stack
              direction="row"
              alignItems="center"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ color: 'common.white', mb: 2 }}
            >
              <Iconify icon="carbon:email" width={24} sx={{ mr: 2 }} />
              <Link color="inherit" href="mailto:hello@creepybutcutepress.com">
                hello@creepybutcutepress.com
              </Link>
            </Stack>

            <Stack
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
              direction="row"
              alignItems="center"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ color: 'common.white' }}
            >
              <Iconify icon="simple-icons:etsy" width={24} sx={{ mr: 2 }} />
              <Link color="inherit" href="https://etsy.com/shop/creepybutcutepress" target="_blank">
                etsy.com/shop/creepybutcutepress
              </Link>
            </Stack>
          </Box>

          <Box sx={{ width: { md: '42%' } }}>
            <Stack alignItems={{ xs: 'center', md: 'flex-start' }}>
              <StyledInput label="Name" sx={{ mb: 2.5 }} />
              <StyledInput label="Email" sx={{ mb: 2.5 }} />
              <StyledInput label="Message" multiline rows={3} sx={{ mb: 5 }} />
              <Button size="large" variant="contained" color="primary">
                Send Message
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
