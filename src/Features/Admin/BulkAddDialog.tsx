import { useEffect, useRef, useState, type DragEvent } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

import { useResponsive } from '../../hooks/use-responsive';
import { slugify, type Asset, type Entry, type FieldDef } from '../../lib/admin-contentful';

type Status = 'ready' | 'uploading' | 'creating' | 'done' | 'error';

type Row = {
  key: string;
  file: File;
  preview: string;
  name: string;
  itemId: string;
  itemIdEdited: boolean;
  status: Status;
  error?: string;
  // Kept after a successful upload so a retry doesn't upload the image twice.
  assetId?: string;
};

type Props = {
  categoryOptions: { id: string; label: string }[];
  // Item IDs already taken by existing shop items
  existingItemIds: string[];
  itemIdField?: FieldDef;
  onUpload: (file: File, title: string) => Promise<Asset>;
  onCreate: (fields: Entry['fields']) => Promise<Entry>;
  onClose: () => void;
};

// Uploads + creates run a few at a time: faster than one by one, without
// tripping Contentful's rate limit (each upload polls while it processes).
const CONCURRENCY = 3;

// "charizard_sticker-v2.png" -> "Charizard Sticker V2"
function nameFromFile(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

let rowCounter = 0;

// One shop item per image, all in the same category - e.g. a whole sheet of
// Pokemon stickers at once. Names/IDs come from the filenames and can be
// fixed up before anything is created.
export default function BulkAddDialog({
  categoryOptions,
  existingItemIds,
  itemIdField,
  onUpload,
  onCreate,
  onClose,
}: Props) {
  const fullScreen = useResponsive('down', 'sm');
  const [category, setCategory] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Free the preview object URLs when the dialog goes away.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addFiles = (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith('image/'));
    const added = images.map((file): Row => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      const name = nameFromFile(file.name);
      rowCounter += 1;
      return { key: `row-${rowCounter}`, file, preview, name, itemId: slugify(name), itemIdEdited: false, status: 'ready' };
    });
    setRows((prev) => [...prev, ...added]);
  };

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const removeRow = (row: Row) => {
    URL.revokeObjectURL(row.preview);
    previews.current.delete(row.preview);
    setRows((prev) => prev.filter((r) => r.key !== row.key));
  };

  const pending = rows.filter((row) => row.status !== 'done');
  const doneCount = rows.length - pending.length;

  // Per-row problems with name/ID - checked against each other and against
  // existing items, since Contentful would reject a duplicate ID anyway.
  const rowErrors = (() => {
    const errors: Record<string, { name?: string; itemId?: string }> = {};
    const pattern = itemIdField?.pattern ? new RegExp(itemIdField.pattern.pattern, itemIdField.pattern.flags) : null;
    const taken = new Set(existingItemIds);
    const counts = new Map<string, number>();
    rows.forEach((row) => counts.set(row.itemId, (counts.get(row.itemId) ?? 0) + 1));

    for (const row of pending) {
      const e: { name?: string; itemId?: string } = {};
      if (!row.name.trim()) e.name = 'Required';
      if (!row.itemId) e.itemId = 'Required';
      else if (pattern && !pattern.test(row.itemId)) e.itemId = itemIdField?.pattern?.message || 'Invalid format';
      else if (taken.has(row.itemId)) e.itemId = 'Already used by an existing item';
      else if ((counts.get(row.itemId) ?? 0) > 1) e.itemId = 'Duplicated in this batch';
      if (e.name || e.itemId) errors[row.key] = e;
    }
    return errors;
  })();

  const handleCreate = async () => {
    setShowErrors(true);
    if (!category || !pending.length || Object.keys(rowErrors).length) return;

    setRunning(true);
    const queue = [...pending];
    const worker = async () => {
      for (let row = queue.shift(); row; row = queue.shift()) {
        const { key, file, name, itemId } = row;
        let { assetId } = row;
        try {
          if (!assetId) {
            updateRow(key, { status: 'uploading', error: undefined });
            assetId = (await onUpload(file, name.trim())).id;
            updateRow(key, { assetId });
          }
          updateRow(key, { status: 'creating', error: undefined });
          // Hidden until switched on from the table, like any new entry.
          await onCreate({ name: name.trim(), itemId, category, images: [assetId], showInApp: false });
          updateRow(key, { status: 'done' });
        } catch (err) {
          updateRow(key, { status: 'error', error: err instanceof Error ? err.message : 'Failed' });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    setRunning(false);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    if (!running) addFiles(Array.from(event.dataTransfer.files));
  };

  const failed = rows.filter((row) => row.status === 'error').length;
  const allDone = rows.length > 0 && doneCount === rows.length;

  return (
    <Dialog open fullWidth maxWidth="md" fullScreen={fullScreen} onClose={running ? undefined : onClose}>
      <DialogTitle>Bulk Add Shop Items</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ py: 1 }}>
          <TextField
            select
            required
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={running}
            error={showErrors && !category}
            helperText={
              showErrors && !category
                ? 'Choose a category'
                : 'Every item below goes into this category - usually a subcategory, e.g. Stickers › Pokemon Stickers'
            }
            fullWidth
          >
            {categoryOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Box
            role="button"
            tabIndex={0}
            onClick={() => !running && fileInput.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !running) fileInput.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 1,
              border: 2,
              borderStyle: 'dashed',
              borderColor: dragOver ? 'primary.main' : 'divider',
              bgcolor: dragOver ? 'action.hover' : 'transparent',
              color: 'text.secondary',
              cursor: running ? 'default' : 'pointer',
              transition: 'border-color 0.15s, background-color 0.15s',
              '&:hover, &:focus-visible': running ? {} : { borderColor: 'primary.main', outline: 'none' },
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography>Drop images here, or click to choose</Typography>
            <Typography variant="caption">One shop item is created per image, named from its filename</Typography>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />
          </Box>

          {showErrors && !rows.length && <Alert severity="error">Add at least one image</Alert>}

          {rows.length > 0 && (
            <Stack spacing={1.5}>
              {rows.map((row) => {
                const locked = running || row.status === 'done';
                const errors = showErrors ? rowErrors[row.key] : undefined;
                return (
                  <Stack key={row.key} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      component="img"
                      src={row.preview}
                      alt=""
                      sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                      <TextField
                        size="small"
                        label="Name"
                        value={row.name}
                        disabled={locked}
                        error={Boolean(errors?.name)}
                        helperText={errors?.name}
                        onChange={(e) =>
                          updateRow(row.key, {
                            name: e.target.value,
                            ...(!row.itemIdEdited && { itemId: slugify(e.target.value) }),
                          })
                        }
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Item ID"
                        value={row.itemId}
                        disabled={locked}
                        error={Boolean(errors?.itemId)}
                        helperText={errors?.itemId}
                        onChange={(e) => updateRow(row.key, { itemId: e.target.value, itemIdEdited: true })}
                        sx={{ flex: 1 }}
                      />
                    </Stack>
                    <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {row.status === 'done' && <CheckCircleIcon color="success" aria-label="Created" />}
                      {(row.status === 'uploading' || row.status === 'creating') && (
                        <CircularProgress size={22} aria-label={row.status === 'uploading' ? 'Uploading' : 'Creating'} />
                      )}
                      {(row.status === 'ready' || row.status === 'error') && (
                        <IconButton size="small" aria-label={`Remove ${row.name}`} disabled={running} onClick={() => removeRow(row)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}

          {rows
            .filter((row) => row.status === 'error')
            .map((row) => (
              <Alert key={row.key} severity="error">
                {row.name || row.file.name}: {row.error}
              </Alert>
            ))}

          {!running && doneCount > 0 && (
            <Alert severity={failed ? 'warning' : 'success'}>
              {allDone
                ? `All ${doneCount} items created and published.`
                : `${doneCount} of ${rows.length} created.${failed ? ' Fix the errors above and create the rest.' : ''}`}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={running}>
          {allDone ? 'Done' : 'Cancel'}
        </Button>
        {!allDone && (
          <Button variant="contained" onClick={handleCreate} disabled={running}>
            {running
              ? `Creating… (${doneCount}/${rows.length})`
              : pending.length
                ? `Create ${pending.length} item${pending.length === 1 ? '' : 's'}`
                : 'Create items'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
