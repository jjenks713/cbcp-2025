import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { type Entry } from '../../lib/admin-contentful';
import { useItemInventory, useSaveInventory } from '../../hooks/queries/admin';
import InventoryEditor, { draftFromRows, rowsFromDraft, validateDraft, type StockDraft } from './InventoryEditor';

type Props = {
  entry: Entry;
  onClose: () => void;
};

// Quick stock editor for one shop item, opened from the Stock column of
// the shop items table - just the stock/price table, without the rest of
// the item's form.
export default function StockDialog({ entry, onClose }: Props) {
  const itemId = String(entry.fields.itemId ?? '');
  const sizes = Array.isArray(entry.fields.sizes) ? entry.fields.sizes.map(String) : [];
  const basePrice = typeof entry.fields.price === 'number' ? entry.fields.price : null;

  const inventoryQuery = useItemInventory(itemId);
  const { mutateAsync: saveInventory, isPending: saving } = useSaveInventory();
  const [draftState, setDraftState] = useState<StockDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const draft = draftState ?? (inventoryQuery.data ? draftFromRows(inventoryQuery.data) : {});

  const handleSave = async () => {
    const problem = validateDraft(draft, sizes);
    setError(problem);
    if (problem) return;
    try {
      await saveInventory({ itemId, rows: rowsFromDraft(draft, sizes) });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose}>
      <DialogTitle>Stock: {String(entry.fields.name ?? 'Item')}</DialogTitle>
      <DialogContent dividers>
        {!itemId ? (
          <Alert severity="warning">This item has no item ID yet, so its stock can&apos;t be set.</Alert>
        ) : inventoryQuery.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : inventoryQuery.error ? (
          <Alert severity="error">{inventoryQuery.error.message}</Alert>
        ) : (
          <InventoryEditor
            sizes={sizes}
            basePrice={basePrice}
            value={draft}
            onChange={(next) => {
              setDraftState(next);
              setError(null);
            }}
            disabled={saving}
            error={error}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !itemId || inventoryQuery.isPending}>
          {saving ? 'Saving…' : 'Save stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
