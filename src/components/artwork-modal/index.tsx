import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Image from '../image';
import Iconify from '../iconify';
import { useResponsive } from '../../hooks/use-responsive';
import { type ArtItem } from '../../lib/contentful';

type Props = {
  item: ArtItem | null;
  open: boolean;
  onClose: () => void;
};

export default function ArtworkModal({ item, open, onClose }: Props) {
  const mdUp = useResponsive('up', 'md');
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset to the cover image whenever a different piece is opened.
  useEffect(() => {
    setActiveIndex(0);
  }, [item?.id]);

  if (!item) return null;

  const images = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [item.coverUrl];
  const details = [
    { label: 'Medium', value: item.medium },
    { label: 'Size', value: item.size },
    { label: 'Edition', value: item.edition },
  ].filter((row) => row.value);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={!mdUp}
      PaperProps={{ sx: { bgcolor: 'secondary.main', borderRadius: { md: 2 } } }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 12,
          top: 12,
          zIndex: 9,
          color: 'common.white',
          bgcolor: (theme) => `${theme.palette.grey[900]}80`,
          '&:hover': { bgcolor: (theme) => `${theme.palette.grey[900]}B0` },
        }}
      >
        <Iconify icon="carbon:close" />
      </IconButton>

      <Box sx={{ display: { md: 'flex' } }}>
        <Box sx={{ width: { md: '55%' }, flexShrink: 0, bgcolor: 'common.black' }}>
          <Image alt={item.title} src={images[activeIndex]} ratio="1/1" />

          {images.length > 1 && (
            <Stack direction="row" spacing={1} sx={{ p: 1.5, overflowX: 'auto' }}>
              {images.map((src, index) => (
                <Box
                  key={src}
                  onClick={() => setActiveIndex(index)}
                  sx={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    opacity: index === activeIndex ? 1 : 0.5,
                    border: '2px solid',
                    borderColor: index === activeIndex ? 'primary.main' : 'transparent',
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <Image alt={`${item.title} ${index + 1}`} src={src} ratio="1/1" />
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <Stack spacing={2} sx={{ width: { md: '45%' }, p: { xs: 3, md: 4 } }}>
          {item.categories && item.categories.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {item.categories.map((cat) => (
                <Chip key={cat} label={cat} size="small" color="primary" variant="outlined" />
              ))}
            </Stack>
          )}

          <Typography variant="h4">{item.title}</Typography>

          {item.description && (
            <Typography sx={{ color: 'text.secondary' }}>{item.description}</Typography>
          )}

          {details.length > 0 && (
            <>
              <Divider sx={{ borderStyle: 'dashed' }} />
              <Stack spacing={1}>
                {details.map((row) => (
                  <Stack key={row.label} direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                      {row.label}
                    </Typography>
                    <Typography variant="body2">{row.value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </Box>
    </Dialog>
  );
}
