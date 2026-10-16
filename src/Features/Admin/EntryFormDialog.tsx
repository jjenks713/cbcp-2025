import { useState, type FormEvent } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import AssetPicker from './AssetPicker';
import InventoryEditor, { draftFromRows, rowsFromDraft, validateDraft, type StockDraft } from './InventoryEditor';
import { useItemInventory, useSaveInventory } from '../../hooks/queries/admin';
import { useResponsive } from '../../hooks/use-responsive';
import { SHOP_ICONS } from '../sections/CBCPShop';
import {
  slugify,
  entryLabel,
  entryPathLabel,
  isGeneratedField,
  type Asset,
  type Entry,
  type FieldDef,
  type FieldValue,
  type ContentType,
} from '../../lib/admin-contentful';

type Props = {
  contentType: ContentType;
  // null when adding a new entry
  entry: Entry | null;
  contentTypes: ContentType[];
  entriesByType: Record<string, Entry[] | undefined>;
  assets: Asset[];
  onUpload: (file: File) => Promise<Asset>;
  // Resolves with the saved entry; the dialog closes itself once done
  // (shop items also save their stock first).
  onSave: (fields: Entry['fields']) => Promise<Entry>;
  onClose: () => void;
};

type Values = Record<string, FieldValue>;

// Slug-style field per content type, auto-filled from the name on new entries.
// (A shop item's ID isn't one - the API generates it.)
const SLUG_FIELDS: Record<string, string> = { shopCategory: 'slug', category: 'slug' };

const isAssetField = (field: FieldDef) => field.linkType === 'Asset' || field.items?.linkType === 'Asset';
const isNumberField = (field: FieldDef) => field.type === 'Integer' || field.type === 'Number';

function emptyValue(field: FieldDef): FieldValue {
  if (field.type === 'Array') return [];
  if (field.type === 'Boolean') return false;
  if (field.type === 'Link') return null;
  return '';
}

function isEmpty(value: FieldValue) {
  return value == null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length);
}

function validate(fields: FieldDef[], values: Values) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.id];
    if (field.required && field.type !== 'Boolean' && isEmpty(value)) {
      errors[field.id] = `${field.name} is required`;
    } else if (isNumberField(field) && !isEmpty(value)) {
      const n = Number(value);
      const { min, max, message } = field.range ?? {};
      if (Number.isNaN(n) || (field.type === 'Integer' && !Number.isInteger(n))) {
        errors[field.id] = field.type === 'Integer' ? 'Must be a whole number' : 'Must be a number';
      } else if ((min != null && n < min) || (max != null && n > max)) {
        errors[field.id] =
          message || (max == null ? `Must be at least ${min}` : min == null ? `Must be at most ${max}` : `Must be ${min}–${max}`);
      }
    } else if (field.pattern && typeof value === 'string' && value) {
      if (!new RegExp(field.pattern.pattern, field.pattern.flags).test(value)) {
        errors[field.id] = field.pattern.message || `${field.name} isn't in the expected format`;
      }
    }
  }
  return errors;
}

// One form for every content type: fields are rendered from the content
// type's live Contentful schema rather than hand-written per type, so a
// field added in Contentful later shows up here without code changes.
export default function EntryFormDialog({
  contentType,
  entry,
  contentTypes,
  entriesByType,
  assets,
  onUpload,
  onSave,
  onClose,
}: Props) {
  const fullScreen = useResponsive('down', 'sm');
  const [values, setValues] = useState<Values>(() =>
    Object.fromEntries(contentType.fields.map((field) => [field.id, entry?.fields[field.id] ?? emptyValue(field)]))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  // On new entries, the slug-style field follows the display field (name)
  // until it's edited by hand. Existing entries keep theirs - a shop item's
  // ID is what orders will reference.
  const slugField = entry ? undefined : SLUG_FIELDS[contentType.id];
  const [slugEdited, setSlugEdited] = useState(false);
  // Generated fields are left out of validation and saving - the API owns them.
  const editableFields = contentType.fields.filter((field) => !isGeneratedField(contentType.id, field.id));

  const setValue = (id: string, value: FieldValue) => {
    const changed: Values = { [id]: value };
    if (slugField && id === slugField) setSlugEdited(true);
    if (slugField && id === contentType.displayField && !slugEdited) {
      changed[slugField] = slugify(String(value ?? ''));
    }

    setValues((prev) => ({ ...prev, ...changed }));
    setErrors((prev) => {
      const rest = { ...prev };
      Object.keys(changed).forEach((key) => delete rest[key]);
      return rest;
    });
  };

  // Entries a Link field may point at - every entry of the content types
  // its validation allows, minus the entry being edited (a category can't
  // be its own parent).
  const linkOptions = (allowedTypes: string[] | undefined) =>
    (allowedTypes ?? [])
      .flatMap((typeId) => {
        const linkedType = contentTypes.find((ct) => ct.id === typeId);
        const linkedEntries = entriesByType[typeId] ?? [];
        return linkedEntries.map((option) => ({
          id: option.id,
          label: entryPathLabel(option, linkedType, linkedEntries),
        }));
      })
      .filter((option) => option.id !== entry?.id)
      .sort((a, b) => a.label.localeCompare(b.label));

  // Shop items also get a stock table (saved to the API's inventory, not
  // Contentful), following the sizes entered above.
  const isShopItem = contentType.id === 'shopItem';
  const existingItemId = entry ? String(entry.fields.itemId ?? '') : '';
  const inventoryQuery = useItemInventory(existingItemId, { enabled: isShopItem });
  const { mutateAsync: saveInventory } = useSaveInventory();
  const [stockDraftState, setStockDraftState] = useState<StockDraft | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  // Item saved but its stock didn't - the next Save only retries the stock
  // (re-saving a new item would create it twice).
  const [stockRetryItemId, setStockRetryItemId] = useState<string | null>(null);
  const stockLoading = isShopItem && Boolean(existingItemId) && inventoryQuery.isPending;
  const stockDraft = stockDraftState ?? (inventoryQuery.data ? draftFromRows(inventoryQuery.data) : {});
  const sizes = Array.isArray(values.sizes) ? values.sizes.map(String) : [];
  const basePrice = isEmpty(values.price) || Number.isNaN(Number(values.price)) ? null : Number(values.price);

  const saveStock = async (itemId: string) => {
    try {
      await saveInventory({ itemId, rows: rowsFromDraft(stockDraft, sizes) });
      return true;
    } catch (err) {
      setStockRetryItemId(itemId);
      setSaveError(
        `The item saved, but its stock didn't: ${err instanceof Error ? err.message : 'unknown error'}. Press Save to try the stock again.`
      );
      setSaving(false);
      return false;
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(editableFields, values);
    setErrors(nextErrors);
    const nextStockError = isShopItem ? validateDraft(stockDraft, sizes) : null;
    setStockError(nextStockError);
    if (Object.keys(nextErrors).length || nextStockError) return;

    setSaving(true);
    setSaveError('');

    if (stockRetryItemId) {
      if (await saveStock(stockRetryItemId)) onClose();
      return;
    }

    const fields = Object.fromEntries(
      editableFields.map((field) => {
        const value = values[field.id];
        return [field.id, isNumberField(field) ? (isEmpty(value) ? null : Number(value)) : value];
      })
    );

    let saved: Entry;
    try {
      saved = await onSave(fields);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
      return;
    }
    if (isShopItem && !(await saveStock(String(saved.fields.itemId ?? existingItemId)))) return;
    onClose();
  };

  const renderField = (field: FieldDef) => {
    const value = values[field.id];
    const common = {
      label: field.name,
      required: field.required,
      error: Boolean(errors[field.id]),
      helperText: errors[field.id],
      fullWidth: true,
      disabled: saving,
    };

    // Not there yet on a new entry; afterwards shown so it can be copied.
    if (isGeneratedField(contentType.id, field.id)) {
      if (!entry) return null;
      return (
        <TextField
          key={field.id}
          label={field.name}
          value={value ?? ''}
          helperText="Generated automatically - can't be changed"
          fullWidth
          slotProps={{ input: { readOnly: true } }}
        />
      );
    }

    if (isAssetField(field)) {
      const ids = Array.isArray(value) ? value : value ? [String(value)] : [];
      return (
        <AssetPicker
          key={field.id}
          label={field.name}
          required={field.required}
          error={errors[field.id]}
          multiple={field.type === 'Array'}
          value={ids}
          assets={assets}
          onUpload={onUpload}
          onChange={(next) => setValue(field.id, field.type === 'Array' ? next : next[0] ?? null)}
        />
      );
    }

    if (field.type === 'Link') {
      const options = linkOptions(field.linkContentTypes);
      return (
        <TextField
          key={field.id}
          {...common}
          select
          value={value ?? ''}
          onChange={(e) => setValue(field.id, e.target.value || null)}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    // A list of text values (e.g. a shop item's sizes): type one and press
    // Enter to add it as a chip.
    if (field.type === 'Array' && field.items?.type === 'Symbol') {
      return (
        <Autocomplete
          key={field.id}
          multiple
          freeSolo
          disabled={saving}
          options={[] as string[]}
          value={Array.isArray(value) ? value : []}
          onChange={(_, next) =>
            setValue(
              field.id,
              Array.from(new Set(next.map((v) => String(v).trim()).filter(Boolean)))
            )
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={field.name}
              required={field.required && !(Array.isArray(value) && value.length)}
              error={Boolean(errors[field.id])}
              helperText={errors[field.id] || 'Type a value and press Enter to add it'}
            />
          )}
        />
      );
    }

    if (field.type === 'Array' && field.items?.type === 'Link') {
      const options = linkOptions(field.items.linkContentTypes);
      const labels = new Map(options.map((option) => [option.id, option.label]));
      return (
        <Autocomplete
          key={field.id}
          multiple
          disabled={saving}
          options={options.map((option) => option.id)}
          getOptionLabel={(id) => labels.get(id) ?? 'Unknown'}
          value={Array.isArray(value) ? value : []}
          onChange={(_, next) => setValue(field.id, next)}
          filterSelectedOptions
          renderInput={(params) => (
            <TextField
              {...params}
              label={field.name}
              required={field.required && !(Array.isArray(value) && value.length)}
              error={Boolean(errors[field.id])}
              helperText={errors[field.id]}
            />
          )}
        />
      );
    }

    if (field.type === 'Boolean') {
      return (
        <FormControlLabel
          key={field.id}
          disabled={saving}
          control={<Switch checked={Boolean(value)} onChange={(e) => setValue(field.id, e.target.checked)} />}
          label={field.name}
        />
      );
    }

    // shopCategory.icon is free text in Contentful, but the site only knows
    // how to render a fixed set of values - offer exactly those.
    if (contentType.id === 'shopCategory' && field.id === 'icon') {
      const known = Object.keys(SHOP_ICONS);
      const current = String(value ?? '');
      return (
        <TextField key={field.id} {...common} select value={current} onChange={(e) => setValue(field.id, e.target.value)}>
          {current && !known.includes(current) && <MenuItem value={current}>{current} (unrecognized)</MenuItem>}
          {known.map((key) => {
            const Icon = SHOP_ICONS[key];
            return (
              <MenuItem key={key} value={key}>
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <Icon fontSize="small" /> {key}
                </Box>
              </MenuItem>
            );
          })}
        </TextField>
      );
    }

    return (
      <TextField
        key={field.id}
        {...common}
        type={isNumberField(field) ? 'number' : 'text'}
        multiline={field.type === 'Text'}
        minRows={field.type === 'Text' ? 3 : undefined}
        value={value ?? ''}
        onChange={(e) => setValue(field.id, e.target.value)}
        slotProps={
          isNumberField(field)
            ? {
                input: field.id === 'price' ? { startAdornment: <InputAdornment position="start">$</InputAdornment> } : undefined,
                htmlInput: {
                  min: field.range?.min,
                  max: field.range?.max,
                  step: field.type === 'Integer' ? 1 : field.id === 'price' ? 0.01 : 'any',
                },
              }
            : undefined
        }
      />
    );
  };

  return (
    <Dialog open fullWidth maxWidth="sm" fullScreen={fullScreen} onClose={saving ? undefined : onClose}>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'contents' }}>
        <DialogTitle>
          {entry ? `Edit ${contentType.name}: ${entryLabel(entry, contentType)}` : `Add ${contentType.name}`}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ py: 1 }}>
            {contentType.fields.map(renderField)}
            {isShopItem &&
              (stockLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <CircularProgress size={16} /> Loading stock…
                </Box>
              ) : (
                <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                  <InventoryEditor
                    sizes={sizes}
                    basePrice={basePrice}
                    value={stockDraft}
                    onChange={(next) => {
                      setStockDraftState(next);
                      setStockError(null);
                    }}
                    disabled={saving}
                    error={stockError}
                  />
                </Box>
              ))}
            {saveError && <Alert severity="error">{saveError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving…' : entry ? 'Save & Publish' : 'Create & Publish'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
