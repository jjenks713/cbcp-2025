import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import CollectionsIcon from '@mui/icons-material/Collections';

import EntriesTable, { FIRST_PAGE } from './EntriesTable';
import BulkAddDialog from './BulkAddDialog';
import { BULK_ADD_CONFIGS, type BulkAddConfig, type BulkRow } from './bulkAddConfigs';
import EntryFormDialog from './EntryFormDialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import StockDialog from './StockDialog';
import StockCell, { useStockByItem } from './StockCell';
import { entryPathLabel, type Asset, type Entry, type ContentType } from '../../lib/admin-contentful';
import {
  useAssets,
  useContentTypes,
  useDeleteEntry,
  useEntriesByType,
  useEntriesPage,
  useSaveEntry,
  useSaveInventory,
  useUploadAsset,
} from '../../hooks/queries/admin';

// Tabs follow how often each type gets edited; anything added in
// Contentful later goes after these, alphabetically.
const TYPE_ORDER = ['artwork', 'category', 'artist', 'shopCategory', 'shopItem', 'faq'];

function sortContentTypes(types: ContentType[]) {
  const rank = (ct: ContentType) => {
    const i = TYPE_ORDER.indexOf(ct.id);
    return i === -1 ? TYPE_ORDER.length : i;
  };
  return [...types].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

// Content types this one links to - their entries are needed to show link
// fields by name in the table and to offer them as choices in the form.
function linkedTypeIds(ct: ContentType) {
  return ct.fields.flatMap((field) => [...(field.linkContentTypes ?? []), ...(field.items?.linkContentTypes ?? [])]);
}

type EntryTarget = { contentType: ContentType; entry: Entry };

const NO_ASSETS: Asset[] = [];

// Content editor - the Admin tab of the account page, which supplies the
// admin theme and only mounts this for admins. Lazy-loaded (see
// App/Routes.tsx), so its code and its Contentful requests never reach
// anyone else.
export default function Admin() {
  const contentTypesQuery = useContentTypes();
  const assetsQuery = useAssets();
  const { mutateAsync: saveEntry } = useSaveEntry();
  const { mutateAsync: deleteEntry } = useDeleteEntry();
  const { mutateAsync: uploadAsset } = useUploadAsset();

  const contentTypes = useMemo(() => sortContentTypes(contentTypesQuery.data ?? []), [contentTypesQuery.data]);
  const assets = assetsQuery.data ?? NO_ASSETS;

  // First tab until one is picked.
  const [chosenTypeId, setActiveTypeId] = useState('');
  const activeTypeId = chosenTypeId || contentTypes[0]?.id || '';
  // entry is null when adding a new one
  const [editing, setEditing] = useState<{ contentType: ContentType; entry: Entry | null } | null>(null);
  const [deleting, setDeleting] = useState<EntryTarget | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  // Shop item whose stock is open in the quick stock editor
  const [stockEditing, setStockEditing] = useState<Entry | null>(null);
  const stockByItem = useStockByItem();

  const activeType = contentTypes.find((ct) => ct.id === activeTypeId);
  // Every entry of each type the active one links to (to show link fields
  // by name and offer them in the form/bulk add). The active type's own
  // entries are paged by the table instead - except when it links to
  // itself (a category's parent), which pulls its full list in here too.
  const neededTypeIds = useMemo(() => (activeType ? Array.from(new Set(linkedTypeIds(activeType))) : []), [activeType]);
  const { entriesByType, error: entriesError, refetch: refetchEntries } = useEntriesByType(neededTypeIds);
  // The table's first page - shared with the table itself - for the type's total.
  const firstPage = useEntriesPage(activeTypeId, FIRST_PAGE);

  const loading = contentTypesQuery.isPending || assetsQuery.isPending;
  const loadError = contentTypesQuery.error ?? assetsQuery.error ?? entriesError;
  const retryLoad = () => {
    contentTypesQuery.refetch();
    assetsQuery.refetch();
    refetchEntries();
  };

  const handleUpload = useCallback((file: File, title?: string) => uploadAsset({ file, title }), [uploadAsset]);

  // Inline Show in App switch on the table: flips just that one field.
  const handleToggleShow = useCallback(
    async (contentType: ContentType, entry: Entry, showInApp: boolean) => {
      await saveEntry({ contentTypeId: contentType.id, entryId: entry.id, fields: { showInApp } });
    },
    [saveEntry]
  );

  // The form closes itself once everything's saved (a shop item's stock
  // goes to the inventory after the entry, using its itemId).
  const handleSave = async (fields: Entry['fields']) => {
    if (!editing) throw new Error('Nothing is being edited');
    const { contentType, entry } = editing;
    return saveEntry({ contentTypeId: contentType.id, entryId: entry?.id, fields });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { contentType, entry } = deleting;
    await deleteEntry({ contentTypeId: contentType.id, entryId: entry.id });
    setDeleting(null);
  };

  // Creates the entry, then its stock rows if the type has any (shop items).
  const { mutateAsync: saveInventory } = useSaveInventory();
  const handleBulkCreate = useCallback(
    async (config: BulkAddConfig, fields: Entry['fields'], row: BulkRow) => {
      const created = await saveEntry({ contentTypeId: config.contentTypeId, fields });
      if (config.inventoryFor) {
        await saveInventory({ itemId: String(created.fields.itemId ?? ''), rows: config.inventoryFor(row) });
      }
      return created;
    },
    [saveEntry, saveInventory]
  );

  const pathLabel = (entry: Entry, contentType: ContentType | undefined) =>
    entryPathLabel(entry, contentType, contentType ? entriesByType[contentType.id] : []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const bulkConfig = activeType ? BULK_ADD_CONFIGS[activeType.id] : undefined;
  const bulkCategoryType = contentTypes.find((ct) => ct.id === bulkConfig?.categoryTypeId);

  return (
    <Box sx={{ color: 'text.primary' }}>
      <Stack spacing={4}>
        {loadError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={retryLoad}>
                Retry
              </Button>
            }
          >
            {loadError.message || 'Failed to load content'}
          </Alert>
        )}

        {contentTypes.length > 0 && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTypeId}
              onChange={(_, id) => setActiveTypeId(id)}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              {contentTypes.map((ct) => (
                <Tab key={ct.id} value={ct.id} label={ct.name} />
              ))}
            </Tabs>
          </Box>
        )}

        {activeType && (
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Typography variant="h5">
                {activeType.name}
                {firstPage.data && !firstPage.isPlaceholderData && (
                  <Typography component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                    ({firstPage.data.total})
                  </Typography>
                )}
              </Typography>
              <Stack direction="row" spacing={1}>
                {bulkConfig && (
                  <Button variant="outlined" startIcon={<CollectionsIcon />} onClick={() => setBulkOpen(true)}>
                    Bulk Add
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setEditing({ contentType: activeType, entry: null })}
                >
                  Add New
                </Button>
              </Stack>
            </Stack>

            <EntriesTable
              key={activeType.id}
              contentType={activeType}
              contentTypes={contentTypes}
              entriesByType={entriesByType}
              assets={assets}
              onEdit={(entry) => setEditing({ contentType: activeType, entry })}
              onDelete={(entry) => setDeleting({ contentType: activeType, entry })}
              onToggleShow={(entry, show) => handleToggleShow(activeType, entry, show)}
              extraColumn={
                activeType.id === 'shopItem'
                  ? {
                      header: 'Stock',
                      render: (entry) => <StockCell entry={entry} stock={stockByItem} onEdit={setStockEditing} />,
                    }
                  : undefined
              }
            />
          </Stack>
        )}
      </Stack>

      {editing && (
        <EntryFormDialog
          key={editing.entry?.id ?? `new-${editing.contentType.id}`}
          contentType={editing.contentType}
          entry={editing.entry}
          contentTypes={contentTypes}
          entriesByType={entriesByType}
          assets={assets}
          onUpload={handleUpload}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {stockEditing && <StockDialog entry={stockEditing} onClose={() => setStockEditing(null)} />}

      {deleting && (
        <ConfirmDeleteDialog
          typeName={deleting.contentType.name}
          label={pathLabel(deleting.entry, deleting.contentType)}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      {bulkOpen && bulkConfig && (
        <BulkAddDialog
          key={bulkConfig.contentTypeId}
          config={bulkConfig}
          categoryOptions={(entriesByType[bulkConfig.categoryTypeId] ?? [])
            .map((cat) => ({ id: cat.id, label: pathLabel(cat, bulkCategoryType) }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          onUpload={handleUpload}
          onCreate={(fields, row) => handleBulkCreate(bulkConfig, fields, row)}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </Box>
  );
}
