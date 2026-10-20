import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

import { useInventory } from '../../hooks/queries/shop';
import { type Entry } from '../../lib/admin-contentful';

/** Inventory rows by itemId, from the shop's (public) stock query. */
export function useStockByItem() {
  const { data } = useInventory();
  return useMemo(() => {
    const byItem = new Map<string, { size: string | null; stock: number }[]>();
    (data ?? []).forEach((row) => byItem.set(row.itemId, [...(byItem.get(row.itemId) ?? []), row]));
    return { byItem, loaded: Boolean(data) };
  }, [data]);
}

type Props = {
  entry: Entry;
  stock: ReturnType<typeof useStockByItem>;
  onEdit: (entry: Entry) => void;
};

// The shop items table's Stock column: the item's total (red at 0), a
// per-size breakdown on hover, and a button for the quick stock editor.
export default function StockCell({ entry, stock, onEdit }: Props) {
  const rows = stock.byItem.get(String(entry.fields.itemId ?? '')) ?? [];
  const total = rows.reduce((sum, r) => sum + r.stock, 0);
  const breakdown = rows
    .filter((r) => r.size)
    .map((r) => `${r.size}: ${r.stock}`)
    .join(' · ');

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Tooltip title={breakdown}>
        <Typography variant="body2" sx={{ minWidth: 28, color: stock.loaded && total === 0 ? 'error.main' : 'inherit' }}>
          {stock.loaded ? total : '…'}
        </Typography>
      </Tooltip>
      <Tooltip title="Edit stock">
        <IconButton
          size="small"
          onClick={() => onEdit(entry)}
          aria-label={`Edit stock for ${String(entry.fields.name ?? 'item')}`}
        >
          <Inventory2OutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
