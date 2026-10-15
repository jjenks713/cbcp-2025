import { useState, type FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
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
      backgroundColor: theme.palette.background.default,
      [`&.${inputLabelClasses.focused}`]: { color: theme.palette.grey[500] },
    },
  })
);

// EmailJS sends straight from the browser (no backend) — these identify
// which EmailJS account/service/template to use, not a secret credential,
// so it's fine that CRA inlines REACT_APP_* vars into the client bundle.
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
const isEmailConfigured = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

type SubmitStatus = 'idle' | 'sending' | 'success' | 'error';

export default function CBCPContact() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!isEmailConfigured) {
      setStatus('error');
      setErrorMessage(
        "The contact form isn't set up yet — email us directly at creepybutcutepress@gmail.com instead."
      );
      return;
    }

    setStatus('sending');
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID as string,
        EMAILJS_TEMPLATE_ID as string,
        { from_name: name, from_email: email, message },
        { publicKey: EMAILJS_PUBLIC_KEY as string }
      );
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[contact] emailjs send failed:', err);
      setStatus('error');
      setErrorMessage('Something went wrong sending your message — please try again or email us directly.');
    }
  };

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

          <Box component="form" onSubmit={handleSubmit} sx={{ width: { md: '42%' } }}>
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
                <TextField
                  label="Name"
                  name="name"
                  value={name}
                  fullWidth
                  onChange={(e) => setName(e.target.value)}
                  required
                  variant="filled"
                  disabled={status === 'sending'}
                />
              </Box>
              <Box
                component={m.div}
                variants={varFade().inRight}
                transition={{ ...varTranEnter(), delay: 0.45 }}
                sx={{ width: 1, mb: 2.5 }}
              >
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  fullWidth
                  variant="filled"
                  disabled={status === 'sending'}
                />
              </Box>
              <Box
                component={m.div}
                variants={varFade().inRight}
                transition={{ ...varTranEnter(), delay: 0.6 }}
                sx={{ width: 1, mb: 5 }}
              >
                <TextField
                  label="Message"
                  name="message"
                  multiline
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  fullWidth
                  variant="filled"
                  disabled={status === 'sending'}
                />
              </Box>
              <Box
                component={m.div}
                variants={varFade().inRight}
                transition={{ ...varTranEnter(), delay: 0.75 }}
                sx={{ width: 1 }}
              >
                <Stack alignItems={{ xs: 'center', md: 'flex-start' }} spacing={2}>
                  <Button
                    type="submit"
                    size="large"
                    variant="contained"
                    color="primary"
                    disabled={status === 'sending'}
                  >
                    {status === 'sending' ? 'Sending…' : 'Send Message'}
                  </Button>

                  {status === 'success' && (
                    <Alert severity="success" sx={{ width: 1 }}>
                      Thanks! Your message has been sent — we'll get back to you soon.
                    </Alert>
                  )}
                  {status === 'error' && (
                    <Alert severity="error" sx={{ width: 1 }}>
                      {errorMessage}
                    </Alert>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
