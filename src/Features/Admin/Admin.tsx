import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CollectionsIcon from '@mui/icons-material/Collections';

import EntriesTable from './EntriesTable';
import BulkAddDialog from './BulkAddDialog';
import EntryFormDialog from './EntryFormDialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { createAdminTheme } from '../../Theme';
import { useAuth } from '../../lib/auth-context';
import { createAdminApi, entryPathLabel, type Asset, type Entry, type ContentType } from '../../lib/admin-contentful';

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

export default function Admin() {
  const theme = useMemo(() => createAdminTheme(), []);
  return (
    <ThemeProvider theme={theme}>
      <AdminPanel />
    </ThemeProvider>
  );
}

function AdminPanel() {
  const { token } = useAuth();
  const api = useMemo(() => createAdminApi(token), [token]);

  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [entriesByType, setEntriesByType] = useState<Record<string, Entry[] | undefined>>({});
  const [activeTypeId, setActiveTypeId] = useState('');
  // entry is null when adding a new one
  const [editing, setEditing] = useState<{ contentType: ContentType; entry: Entry | null } | null>(null);
  const [deleting, setDeleting] = useState<EntryTarget | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestedTypes = useRef(new Set<string>());

  useEffect(() => {
    Promise.all([api.getContentTypes(), api.getAssets()])
      .then(([types, allAssets]) => {
        const sorted = sortContentTypes(types);
        setContentTypes(sorted);
        setAssets(allAssets);
        setActiveTypeId((current) => current || sorted[0]?.id || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load content types'))
      .finally(() => setLoading(false));
  }, [api]);

  // Each type's entries are fetched once, the first time they're needed.
  const loadEntries = useCallback(
    (typeId: string) => {
      if (requestedTypes.current.has(typeId)) return;
      requestedTypes.current.add(typeId);
      api
        .getEntries(typeId)
        .then((entries) => setEntriesByType((prev) => ({ ...prev, [typeId]: entries })))
        .catch((err) => {
          requestedTypes.current.delete(typeId);
          setError(err instanceof Error ? err.message : `Failed to load ${typeId} entries`);
        });
    },
    [api]
  );

  const activeType = contentTypes.find((ct) => ct.id === activeTypeId);

  useEffect(() => {
    if (!activeType) return;
    [activeType.id, ...linkedTypeIds(activeType)].forEach(loadEntries);
  }, [activeType, loadEntries]);

  const handleUpload = useCallback(
    async (file: File, title?: string) => {
      const asset = await api.uploadAsset(file, title);
      setAssets((prev) => [asset, ...prev]);
      return asset;
    },
    [api]
  );

  // Replaces an updated entry in place, or adds a new one.
  const storeEntry = useCallback((typeId: string, saved: Entry) => {
    setEntriesByType((prev) => {
      const list = prev[typeId] ?? [];
      const exists = list.some((e) => e.id === saved.id);
      return { ...prev, [typeId]: exists ? list.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...list] };
    });
  }, []);

  // Inline Show in App switch on the table: flips just that one field.
  const handleToggleShow = useCallback(
    async (contentType: ContentType, entry: Entry, showInApp: boolean) => {
      const saved = await api.updateEntry(contentType.id, entry.id, { showInApp });
      storeEntry(contentType.id, saved);
    },
    [api, storeEntry]
  );

  const handleSave = async (fields: Entry['fields']) => {
    if (!editing) return;
    const { contentType, entry } = editing;
    const saved = entry
      ? await api.updateEntry(contentType.id, entry.id, fields)
      : await api.createEntry(contentType.id, fields);
    storeEntry(contentType.id, saved);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { contentType, entry } = deleting;
    await api.deleteEntry(contentType.id, entry.id);
    setEntriesByType((prev) => ({
      ...prev,
      [contentType.id]: (prev[contentType.id] ?? []).filter((e) => e.id !== entry.id),
    }));
    setDeleting(null);
  };

  const handleBulkCreate = useCallback(
    async (fields: Entry['fields']) => {
      const created = await api.createEntry('shopItem', fields);
      storeEntry('shopItem', created);
      return created;
    },
    [api, storeEntry]
  );

  const pathLabel = (entry: Entry, contentType: ContentType | undefined) =>
    entryPathLabel(entry, contentType, contentType ? entriesByType[contentType.id] : []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const activeEntries = activeType ? entriesByType[activeType.id] : undefined;
  const shopCategoryType = contentTypes.find((ct) => ct.id === 'shopCategory');

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, color: 'text.primary' }}>
      <Stack spacing={4}>
        <Typography variant="h3" sx={{ color: 'primary.main' }}>
          Content Admin
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
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
                {activeEntries && (
                  <Typography component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                    ({activeEntries.length})
                  </Typography>
                )}
              </Typography>
              <Stack direction="row" spacing={1}>
                {activeType.id === 'shopItem' && (
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
              entries={activeEntries}
              contentTypes={contentTypes}
              entriesByType={entriesByType}
              assets={assets}
              onEdit={(entry) => setEditing({ contentType: activeType, entry })}
              onDelete={(entry) => setDeleting({ contentType: activeType, entry })}
              onToggleShow={(entry, show) => handleToggleShow(activeType, entry, show)}
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

      {deleting && (
        <ConfirmDeleteDialog
          typeName={deleting.contentType.name}
          label={pathLabel(deleting.entry, deleting.contentType)}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      {bulkOpen && (
        <BulkAddDialog
          categoryOptions={(entriesByType.shopCategory ?? [])
            .map((cat) => ({ id: cat.id, label: pathLabel(cat, shopCategoryType) }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          existingItemIds={(entriesByType.shopItem ?? []).map((item) => String(item.fields.itemId ?? ''))}
          itemIdField={contentTypes.find((ct) => ct.id === 'shopItem')?.fields.find((f) => f.id === 'itemId')}
          onUpload={handleUpload}
          onCreate={handleBulkCreate}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </Container>
  );
}
