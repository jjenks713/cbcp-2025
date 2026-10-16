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
import InputAdornment from '@mui/material/InputAdornment';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

import { useResponsive } from '../../hooks/use-responsive';
import { type Asset, type Entry } from '../../lib/admin-contentful';
import { type BulkAddConfig, type BulkField, type BulkRow } from './bulkAddConfigs';

type Status = 'ready' | 'uploading' | 'creating' | 'done' | 'error';

type Row = {
  key: string;
  file: File;
  preview: string;
  name: string;
  // Raw input per config.rowFields id, converted by config.toFields.
  values: Record<string, string>;
  status: Status;
  error?: string;
  // Kept after a successful upload so a retry doesn't upload the image twice.
  assetId?: string;
};

type Props = {
  config: BulkAddConfig;
  categoryOptions: { id: string; label: string }[];
  onUpload: (file: File, title: string) => Promise<Asset>;
  // Gets the row too, for anything saved alongside the entry (e.g. stock).
  onCreate: (fields: Entry['fields'], row: BulkRow) => Promise<Entry>;
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

// 'Required' means not filled in yet - not shown as an error, just counted.
// Other messages are kept short; they show under narrow fields. Price/count
// rules match the shopItem schema (scripts/add-shop-price-stock.js).
function fieldError(field: BulkField, value: string) {
  if (!value.trim()) return field.required ? 'Required' : '';
  const n = Number(value);
  if (field.kind === 'price') return Number.isNaN(n) || n < 0 ? '0 or more' : '';
  if (field.kind === 'count') return !Number.isInteger(n) || n < 0 ? 'Whole number' : '';
  return '';
}

// Only real mistakes go red - a field that's just empty isn't one yet.
const shownError = (error?: string) => (error && error !== 'Required' ? error : undefined);

const plural = ([one, many]: [string, string], n: number) => `${n} ${n === 1 ? one : many}`;

let rowCounter = 0;

// One entry per image, all in the same category (or categories) - e.g. a
// whole sheet of Pokemon stickers, or a set of drawings. Each image becomes
// a row with its own name (from the filename) and the type's extra fields
// (price/stock for shop items, medium/size for artwork). Nothing is
// uploaded or created until every row is complete and "Create & publish"
// is pressed. Field setup per content type lives in bulkAddConfigs.ts.
export default function BulkAddDialog({ config, categoryOptions, onUpload, onCreate, onClose }: Props) {
  const fullScreen = useResponsive('down', 'sm');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // "Apply to all" inputs - fill a field on every row in one go.
  const [allValues, setAllValues] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  // Free the preview object URLs when the dialog goes away.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const emptyValues = () => Object.fromEntries(config.rowFields.map((field) => [field.id, '']));

  const addFiles = (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith('image/'));
    const added = images.map((file): Row => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      rowCounter += 1;
      return { key: `row-${rowCounter}`, file, preview, name: nameFromFile(file.name), values: emptyValues(), status: 'ready' };
    });
    setRows((prev) => [...prev, ...added]);
  };

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const setRowValue = (row: Row, fieldId: string, value: string) =>
    updateRow(row.key, { values: { ...row.values, [fieldId]: value } });

  const removeRow = (row: Row) => {
    URL.revokeObjectURL(row.preview);
    previews.current.delete(row.preview);
    setRows((prev) => prev.filter((r) => r.key !== row.key));
  };

  const pending = rows.filter((row) => row.status !== 'done');
  const doneCount = rows.length - pending.length;

  const errorsFor = (row: Row) => {
    const errors: Record<string, string> = { name: row.name.trim() ? '' : 'Required' };
    config.rowFields.forEach((field) => {
      errors[field.id] = fieldError(field, row.values[field.id] ?? '');
    });
    return errors;
  };
  const rowErrors = new Map(pending.map((row) => [row.key, errorsFor(row)]));
  const incomplete = pending.filter((row) => Object.values(rowErrors.get(row.key) ?? {}).some(Boolean)).length;
  const canCreate = categoryIds.length > 0 && pending.length > 0 && incomplete === 0;

  // "a name, price and stock" / "a title"
  const requiredLabels = [config.nameLabel, ...config.rowFields.filter((f) => f.required).map((f) => f.label)].map(
    (label) => label.toLowerCase()
  );
  const needs =
    requiredLabels.length > 1
      ? `${requiredLabels.slice(0, -1).join(', ')} and ${requiredLabels[requiredLabels.length - 1]}`
      : requiredLabels[0];

  // Why "Create & publish" is still disabled, shown beside it.
  const blocker = !categoryIds.length
    ? `Choose ${config.multipleCategories ? 'at least one category' : 'a category'}`
    : !rows.length
      ? 'Add some images'
      : incomplete
        ? `${plural(config.noun, incomplete)} still need${incomplete === 1 ? 's' : ''} a ${needs}, or ha${incomplete === 1 ? 's' : 've'} an invalid value`
        : '';

  const applyToAll = () => {
    const filled = Object.fromEntries(Object.entries(allValues).filter(([, value]) => value.trim()));
    setRows((prev) => prev.map((row) => (row.status === 'done' ? row : { ...row, values: { ...row.values, ...filled } })));
  };

  const handleCreate = async () => {
    if (!canCreate) return;

    setRunning(true);
    const queue = [...pending];
    const worker = async () => {
      for (let row = queue.shift(); row; row = queue.shift()) {
        const { key, file, name, values } = row;
        let { assetId } = row;
        try {
          if (!assetId) {
            updateRow(key, { status: 'uploading', error: undefined });
            assetId = (await onUpload(file, name.trim())).id;
            updateRow(key, { assetId });
          }
          updateRow(key, { status: 'creating', error: undefined });
          const bulkRow = { name: name.trim(), values, categoryIds, assetId };
          await onCreate(config.toFields(bulkRow), bulkRow);
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
  const categoryLabel = new Map(categoryOptions.map((option) => [option.id, option.label]));

  // One price/count/text input - used per row and in the "apply to all" row.
  const fieldInput = (field: BulkField, value: string, onChange: (value: string) => void, disabled: boolean, error?: string) => (
    <TextField
      key={field.id}
      size="small"
      label={field.label}
      type={field.kind === 'text' ? 'text' : 'number'}
      value={value}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input:
          field.kind === 'price' ? { startAdornment: <InputAdornment position="start">$</InputAdornment> } : undefined,
        htmlInput: field.kind === 'text' ? undefined : { min: 0, step: field.kind === 'price' ? 0.01 : 1 },
      }}
      sx={{ width: { sm: field.width } }}
    />
  );

  return (
    <Dialog open fullWidth maxWidth="md" fullScreen={fullScreen} onClose={running ? undefined : onClose}>
      <DialogTitle>{config.title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ py: 1 }}>
          <TextField
            select
            required
            label={config.categoryLabel}
            value={config.multipleCategories ? categoryIds : (categoryIds[0] ?? '')}
            onChange={(e) => {
              const value = e.target.value as string | string[];
              setCategoryIds(Array.isArray(value) ? value : value ? [value] : []);
            }}
            disabled={running}
            helperText={config.categoryHelp}
            slotProps={{
              select: config.multipleCategories
                ? {
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).map((id) => categoryLabel.get(id) ?? 'Unknown').join(', '),
                  }
                : undefined,
            }}
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
            <Typography variant="caption">
              One {config.noun[0]} is created per image, named from its filename
            </Typography>
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

          {rows.length > 1 && pending.length > 0 && (
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Same for every {config.noun[0]}?
              </Typography>
              {config.rowFields.map((field) =>
                fieldInput(
                  field,
                  allValues[field.id] ?? '',
                  (value) => setAllValues((prev) => ({ ...prev, [field.id]: value })),
                  running
                )
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={applyToAll}
                disabled={running || !Object.values(allValues).some((value) => value.trim())}
              >
                Apply to all
              </Button>
            </Stack>
          )}

          {rows.length > 0 && (
            <Stack spacing={1.5}>
              {rows.map((row) => {
                const locked = running || row.status === 'done';
                const errors = rowErrors.get(row.key);
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
                        label={config.nameLabel}
                        value={row.name}
                        disabled={locked}
                        error={Boolean(shownError(errors?.name))}
                        helperText={shownError(errors?.name)}
                        onChange={(e) => updateRow(row.key, { name: e.target.value })}
                        sx={{ flex: 1, minWidth: 0 }}
                      />
                      {config.rowFields.map((field) =>
                        fieldInput(
                          field,
                          row.values[field.id] ?? '',
                          (value) => setRowValue(row, field.id, value),
                          locked,
                          shownError(errors?.[field.id])
                        )
                      )}
                    </Stack>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {row.status === 'done' && <CheckCircleIcon color="success" aria-label="Created" />}
                      {(row.status === 'uploading' || row.status === 'creating') && (
                        <CircularProgress size={22} aria-label={row.status === 'uploading' ? 'Uploading' : 'Creating'} />
                      )}
                      {(row.status === 'ready' || row.status === 'error') && (
                        <IconButton
                          size="small"
                          aria-label={`Remove ${row.name}`}
                          disabled={running}
                          onClick={() => removeRow(row)}
                        >
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
                ? `All ${plural(config.noun, doneCount)} created and published.`
                : `${doneCount} of ${rows.length} created.${failed ? ' Fix the errors above and create the rest.' : ''}`}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {!allDone && !running && blocker && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mr: 'auto' }}>
            {blocker}
          </Typography>
        )}
        <Button onClick={onClose} disabled={running}>
          {allDone ? 'Done' : 'Cancel'}
        </Button>
        {!allDone && (
          <Button variant="contained" onClick={handleCreate} disabled={running || !canCreate}>
            {running
              ? `Creating… (${doneCount}/${rows.length})`
              : pending.length
                ? `Create & publish ${plural(config.noun, pending.length)}`
                : 'Create & publish'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
