import GlobalStyles from '@mui/material/GlobalStyles';
import { alpha, useTheme } from '@mui/material/styles';

export default function StyledLightbox() {
  const theme = useTheme();

  return (
    <GlobalStyles
      styles={{
        '.yarl__root': {
          '--yarl__thumbnails_thumbnail_padding': 0,
          '--yarl__thumbnails_thumbnail_border': 'transparent',
          '--yarl__color_backdrop': alpha(theme.palette.grey[900], 0.9),
          '--yarl__slide_captions_container_background': alpha(theme.palette.grey[900], 0.48),
        },
        '.yarl__slide_title': {
          fontSize: theme.typography.h5.fontSize,
          fontWeight: theme.typography.h5.fontWeight,
          lineHeight: theme.typography.h5.lineHeight,
        },
        '.yarl__slide_description': {
          fontSize: theme.typography.body2.fontSize,
          fontWeight: theme.typography.body2.fontWeight,
          lineHeight: theme.typography.body2.lineHeight,
        },
        '.yarl__button': {
          filter: 'unset',
        },
        '.yarl__thumbnails_thumbnail': {
          opacity: 0.48,
          '&.yarl__thumbnails_thumbnail_active': {
            opacity: 1,
          },
        },
        '.yarl__thumbnails_vignette': {
          '--yarl__thumbnails_vignette_size': 0,
        },
        '.yarl__video_container': {
          backgroundColor: theme.palette.common.black,
        },
      }}
    />
  );
}
