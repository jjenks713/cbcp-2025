import { motion as m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import PrintIcon from '@mui/icons-material/Print';
import LabelIcon from '@mui/icons-material/Label';
import BrushIcon from '@mui/icons-material/Brush';
import EditIcon from '@mui/icons-material/Edit';

import { MotionViewport, varFade, varZoom } from '../../components/animate';

const COLORS = ['primary', 'secondary', 'warning', 'success'] as const;

const STYLES = [
  {
    name: 'Screen Printing',
    icon: PrintIcon,
    description:
      "Hand-pulled, layer by layer — each color inked and pressed by hand for rich, tactile texture no digital print can match.",
  },
  {
    name: 'Sticker Making',
    icon: LabelIcon,
    description:
      'Hand-drawn first, then brought digital and die-cut and laminated for a durable, waterproof finish that’s ready to stick anywhere.',
  },
  {
    name: 'Painting',
    icon: BrushIcon,
    description:
      'Acrylic and mixed media built up in layers, blending soft color with sharp detail to bring each character to life.',
  },
  {
    name: 'Drawing',
    icon: EditIcon,
    description:
      'Graphite, ink, and charcoal — the foundation of every piece, where the strange and the beautiful first take shape.',
  },
];

export default function CBCPArtStyles() {
  return (
    <Container component={MotionViewport} sx={{ py: { xs: 5, md: 10 } }}>
      <Stack
        spacing={3}
        sx={{
          maxWidth: 480,
          mb: { xs: 8, md: 5 },
          mx: { xs: 'auto', md: 'unset' },
          textAlign: { xs: 'center', md: 'unset' },
        }}
      >
        <Box component={m.div} variants={varFade().inUp}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>
            Art Styles
          </Typography>
        </Box>

        <Box component={m.div} variants={varFade().inUp}>
          <Typography variant="h2">The Creative Process</Typography>
        </Box>

        <Box component={m.div} variants={varFade().inUp}>
          <Typography sx={{ color: 'text.secondary' }}>
            Every medium brings something different to the table. Here's a look at the techniques
            behind the Creepy But Cute Press aesthetic.
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          gap: 4,
          display: 'grid',
          alignItems: 'flex-end',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
        }}
      >
        {STYLES.map((style, index) => (
          <Box key={style.name} component={m.div} variants={varZoom().in}>
            <FlipCard
              style={style}
              color={COLORS[index]}
              sx={{
                ...(index === 1 && { mb: { md: 2.5 } }),
                ...(index === 2 && { mb: { md: 5 } }),
                ...(index === 3 && { mb: { md: 7.5 } }),
              }}
            />
          </Box>
        ))}
      </Box>
    </Container>
  );
}

function FlipCard({
  style,
  color,
  sx,
}: {
  style: (typeof STYLES)[number];
  color: (typeof COLORS)[number];
  sx?: object;
}) {
  const faceSx = (theme: any) => ({
    position: 'absolute',
    inset: 0,
    p: 4,
    borderRadius: 2,
    display: 'flex',
    flexDirection: 'column',
    // backface-visibility is what makes the card read as flipping rather
    // than mirroring through itself — the face rotated away from the
    // viewer (beyond 90deg) is hidden instead of showing its content
    // reversed.
    backfaceVisibility: 'hidden',
    color: (theme.palette[color] as any).darker ?? theme.palette[color].dark,
    bgcolor: (theme.palette[color] as any).light ?? theme.palette[color].main + '22',
    boxShadow: `-8px 12px 32px 0px ${alpha(theme.palette[color].main, 0.2)}`,
  });

  return (
    // perspective is what gives the rotation below actual 3D depth
    // instead of just squashing flat.
    <Box sx={{ perspective: 1200, height: 220, ...sx }}>
      <Box
        className="flip-card-inner"
        sx={{
          position: 'relative',
          width: 1,
          height: 1,
          transition: (theme) => theme.transitions.create('transform', { duration: 600 }),
          transformStyle: 'preserve-3d',
          '&:hover': { transform: 'rotateY(180deg)' },
        }}
      >
        {/* Front */}
        <Box sx={(theme) => ({ ...faceSx(theme), justifyContent: 'space-between' })}>
          <style.icon sx={{ fontSize: 64, opacity: 0.48 }} />
          <Typography variant="h5" sx={{ textAlign: 'right' }}>
            {style.name}
          </Typography>
        </Box>

        {/* Back */}
        <Box
          sx={(theme) => ({
            ...faceSx(theme),
            transform: 'rotateY(180deg)',
            justifyContent: 'center',
            textAlign: 'center',
          })}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {style.name}
          </Typography>
          <Typography variant="body2">{style.description}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
