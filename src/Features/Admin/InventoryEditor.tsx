import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { formatPrice } from '../../lib/format';
import { type InventoryInput, type InventoryRow } from '../../lib/shop-api';

// Draft values as typed, by size ('' = an item without sizes).
export type StockDraft = Record<string, { stock: string; price: string }>;

const NO_SIZE = '';
const keysFor = (sizes: string[]) => (sizes.length ? sizes : [NO_SIZE]);

export function draftFromRows(rows: InventoryRow[]): StockDraft {
  return Object.fromEntries(
    rows.map((r) => [r.size ?? NO_SIZE, { stock: String(r.stock), price: r.price == null ? '' : String(r.price) }])
  );
}

/** What to save: one row per current size (or one without a size); untyped stock = 0. */
export function rowsFromDraft(draft: StockDraft, sizes: string[]): InventoryInput[] {
  return keysFor(sizes).map((key) => {
    const value = draft[key];
    return {
      size: key || null,
      stock: value?.stock.trim() ? Number(value.stock) : 0,
      price: value?.price.trim() ? Number(value.price) : null,
    };
  });
}

/** First problem with the draft, if any - same rules as the API. */
export function validateDraft(draft: StockDraft, sizes: string[]): string | null {
  for (const key of keysFor(sizes)) {
    const value = draft[key];
    const label = key || 'this item';
    const stock = value?.stock.trim() ? Number(value.stock) : 0;
    if (!Number.isInteger(stock) || stock < 0) return `Stock for ${label} must be a whole number, 0 or more`;
    if (value?.price.trim()) {
      const price = Number(value.price);
      if (Number.isNaN(price) || price < 0) return `Price for ${label} must be 0 or more (or blank)`;
    }
  }
  return null;
}

type Props = {
  sizes: string[];
  // The item's price - the default for sizes with no price of their own
  basePrice: number | null;
  value: StockDraft;
  onChange: (next: StockDraft) => void;
  disabled?: boolean;
  error?: string | null;
};

// Stock (and per-size price) for one shop item: a row per size, or a
// single row for an item without sizes. Used in the shop item form and the
// table's quick stock editor.
export default function InventoryEditor({ sizes, basePrice, value, onChange, disabled, error }: Props) {
  const set = (key: string, field: 'stock' | 'price', next: string) =>
    onChange({ ...value, [key]: { stock: value[key]?.stock ?? '', price: value[key]?.price ?? '', [field]: next } });

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="subtitle2">Stock{sizes.length ? ' & pricing by size' : ''}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {sizes.length
            ? `Leave a price blank to use the item price${basePrice != null ? ` (${formatPrice(basePrice)})` : ''}. 0 stock shows that size as sold out.`
            : 'How many are available. 0 shows the item as sold out.'}
        </Typography>
      </Box>

      {keysFor(sizes).map((key) => (
        <Stack key={key || 'one'} direction="row" spacing={1.5} alignItems="center">
          <Typography variant="body2" sx={{ width: 96, flexShrink: 0, fontWeight: 500 }} noWrap title={key}>
            {key || 'Stock'}
          </Typography>
          {sizes.length > 0 && (
            <TextField
              size="small"
              label="Price"
              type="number"
              value={value[key]?.price ?? ''}
              onChange={(e) => set(key, 'price', e.target.value)}
              disabled={disabled}
              placeholder={basePrice != null ? String(basePrice) : ''}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                htmlInput: { min: 0, step: 0.01, 'aria-label': `Price for ${key}` },
                inputLabel: { shrink: true },
              }}
              sx={{ width: 140 }}
            />
          )}
          <TextField
            size="small"
            label="Stock"
            type="number"
            value={value[key]?.stock ?? ''}
            onChange={(e) => set(key, 'stock', e.target.value)}
            disabled={disabled}
            placeholder="0"
            slotProps={{
              htmlInput: { min: 0, step: 1, 'aria-label': key ? `Stock for ${key}` : 'Stock' },
              inputLabel: { shrink: true },
            }}
            sx={{ width: 110 }}
          />
        </Stack>
      ))}

      {error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}
