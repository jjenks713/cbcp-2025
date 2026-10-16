import { useState, type ChangeEvent } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import UploadIcon from '@mui/icons-material/Upload';

import { thumbUrl, type Asset } from '../../lib/admin-contentful';

type Props = {
  label: string;
  required?: boolean;
  error?: string;
  multiple?: boolean;
  value: string[];
  assets: Asset[];
  onChange: (ids: string[]) => void;
  onUpload: (file: File) => Promise<Asset>;
};

// Picks one (or, for Array-of-Asset fields, several) images: either an
// asset already in Contentful, or a new file uploaded on the spot.
export default function AssetPicker({ label, required, error, multiple, value, assets, onChange, onUpload }: Props) {
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const add = (ids: string[]) => onChange(multiple ? [...value, ...ids] : ids.slice(0, 1));

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    setUploading(true);
    setUploadError('');
    try {
      // Sequential rather than Promise.all - each upload waits on Contentful
      // processing, and a burst of them is more likely to hit rate limits.
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push((await onUpload(file)).id);
      }
      add(uploaded);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" sx={{ color: error ? 'error.main' : 'text.secondary' }}>
        {label}
        {required && ' *'}
      </Typography>

      {value.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {value.map((id) => {
            const asset = byId.get(id);
            return (
              <Box
                key={id}
                sx={{
                  position: 'relative',
                  width: 96,
                  height: 96,
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: 'action.hover',
                }}
              >
                {asset?.url && (
                  <Box
                    component="img"
                    src={thumbUrl(asset.url, 192)}
                    alt={asset.title}
                    sx={{ width: 1, height: 1, objectFit: 'cover', display: 'block' }}
                  />
                )}
                <IconButton
                  size="small"
                  aria-label={`Remove ${asset?.title || 'image'}`}
                  onClick={() => onChange(value.filter((v) => v !== id))}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    p: 0.25,
                    color: 'common.white',
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Stack>
      )}

      {(multiple || value.length === 0) && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Autocomplete
            sx={{ flex: 1 }}
            size="small"
            options={assets.filter((asset) => asset.url && !value.includes(asset.id))}
            getOptionLabel={(asset) => asset.title || asset.id}
            value={null}
            inputValue={search}
            onInputChange={(_, next) => setSearch(next)}
            onChange={(_, asset) => {
              if (asset) add([asset.id]);
              setSearch('');
            }}
            blurOnSelect
            disabled={uploading}
            renderOption={({ key, ...optionProps }, asset) => (
              <Box component="li" key={key} {...optionProps} sx={{ gap: 1.5 }}>
                <Box
                  component="img"
                  src={thumbUrl(asset.url, 80)}
                  alt=""
                  loading="lazy"
                  sx={{ width: 40, height: 40, borderRadius: 0.5, objectFit: 'cover', flexShrink: 0 }}
                />
                {asset.title || asset.id}
              </Box>
            )}
            renderInput={(params) => <TextField {...params} label="Choose existing image" />}
          />
          <Button
            component="label"
            variant="outlined"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
            sx={{ flexShrink: 0 }}
          >
            {uploading ? 'Uploading…' : 'Upload'}
            <input hidden type="file" accept="image/*" multiple={multiple} onChange={handleFiles} />
          </Button>
        </Stack>
      )}

      {error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {error}
        </Typography>
      )}
      {uploadError && <Alert severity="error">{uploadError}</Alert>}
    </Stack>
  );
}
