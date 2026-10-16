import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import SearchIcon from '@mui/icons-material/Search';

import {
  thumbUrl,
  entryPathLabel,
  type Asset,
  type Entry,
  type FieldDef,
  type FieldValue,
  type ContentType,
} from '../../lib/admin-contentful';

type Props = {
  contentType: ContentType;
  // undefined while this type's entries are still loading
  entries: Entry[] | undefined;
  contentTypes: ContentType[];
  entriesByType: Record<string, Entry[] | undefined>;
  assets: Asset[];
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
  onToggleShow: (entry: Entry, show: boolean) => Promise<void>;
};

type Visibility = 'all' | 'shown' | 'hidden';

const SHOW_FIELD = 'showInApp';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const isAssetField = (field: FieldDef) => field.linkType === 'Asset' || field.items?.linkType === 'Asset';
const isEntryLinkField = (field: FieldDef) => field.linkType === 'Entry' || field.items?.linkType === 'Entry';
const linkIds = (value: FieldValue) => (Array.isArray(value) ? value : value ? [String(value)] : []);

/** rootId plus the ids of everything nested under it (children, grandchildren, ...). */
function withDescendants(rootId: string, options: { id: string; parentId?: string }[]) {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const option of options) {
      if (option.parentId && ids.has(option.parentId) && !ids.has(option.id)) {
        ids.add(option.id);
        grew = true;
      }
    }
  }
  return ids;
}

// Entries list for one content type: search by name, filter by the type's
// first entry-link field (artwork -> categories, shop item -> category,
// categories -> parent) and by Show in App, an inline Show in App switch,
// and pagination. Remounted per type (keyed by the parent), so
// search/filters/page start fresh on every tab.
export default function EntriesTable({
  contentType,
  entries,
  contentTypes,
  entriesByType,
  assets,
  onEdit,
  onDelete,
  onToggleShow,
}: Props) {
  const [search, setSearch] = useState('');
  const [filterId, setFilterId] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('all');
  // Switch positions shown while their save is in flight (rolled back on failure).
  const [pendingShow, setPendingShow] = useState<Record<string, boolean>>({});
  const [toggleError, setToggleError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const typeById = useMemo(() => new Map(contentTypes.map((ct) => [ct.id, ct])), [contentTypes]);

  // Any loaded entry by id, with its type - for showing link fields by name.
  const entryIndex = useMemo(() => {
    const index = new Map<string, { entry: Entry; contentType?: ContentType }>();
    for (const [typeId, list] of Object.entries(entriesByType)) {
      list?.forEach((entry) => index.set(entry.id, { entry, contentType: typeById.get(typeId) }));
    }
    return index;
  }, [entriesByType, typeById]);

  const assetIndex = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);

  const pathLabel = (entry: Entry, type: ContentType | undefined) =>
    entryPathLabel(entry, type, type ? entriesByType[type.id] : []);

  const imageField = contentType.fields.find(isAssetField);
  // Only types migrated to have the field get the column/filter.
  const hasShowField = contentType.fields.some((field) => field.id === SHOW_FIELD);
  const summaryFields = contentType.fields
    .filter(
      (field) =>
        field.id !== contentType.displayField &&
        field.id !== SHOW_FIELD &&
        field.type !== 'Text' &&
        !isAssetField(field)
    )
    .slice(0, 3);
  const displayFieldName = contentType.fields.find((f) => f.id === contentType.displayField)?.name ?? 'Name';

  const filterField = contentType.fields.find(isEntryLinkField);
  const filterTypeIds = filterField?.linkContentTypes ?? filterField?.items?.linkContentTypes ?? [];
  const filterOptions = filterTypeIds
    .flatMap((typeId) => (entriesByType[typeId] ?? []).map((entry) => ({
      id: entry.id,
      label: pathLabel(entry, typeById.get(typeId)),
      parentId: typeof entry.fields.parentCategory === 'string' ? entry.fields.parentCategory : undefined,
    })))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Filtering by a parent category includes everything in its subcategories
  // too - "Stickers" shows Pokemon stickers, etc.
  const filterSet = filterId ? withDescendants(filterId, filterOptions) : null;

  const isShown = (entry: Entry) => pendingShow[entry.id] ?? entry.fields[SHOW_FIELD] === true;

  const query = search.trim().toLowerCase();
  // Newest first by date added - not by last update, or flipping a switch
  // would jump that row to the top.
  const visible = (entries ?? [])
    .filter((entry) => !query || pathLabel(entry, contentType).toLowerCase().includes(query))
    .filter((entry) => !filterSet || !filterField || linkIds(entry.fields[filterField.id]).some((id) => filterSet.has(id)))
    .filter((entry) => visibility === 'all' || isShown(entry) === (visibility === 'shown'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const toggleShow = async (entry: Entry, show: boolean) => {
    setToggleError('');
    setPendingShow((prev) => ({ ...prev, [entry.id]: show }));
    try {
      await onToggleShow(entry, show);
    } catch (err) {
      setToggleError(`Couldn't update ${pathLabel(entry, contentType)}: ${err instanceof Error ? err.message : 'save failed'}`);
    } finally {
      setPendingShow(({ [entry.id]: _done, ...rest }) => rest);
    }
  };

  // Deleting the last row of the last page would otherwise leave an empty page.
  const lastPage = Math.max(0, Math.ceil(visible.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const pageRows = visible.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

  const formatValue = (field: FieldDef, value: FieldValue) => {
    if (field.type === 'Boolean') return value ? 'Yes' : '—';
    const ids = isEntryLinkField(field) ? linkIds(value) : null;
    if (ids) {
      if (!ids.length) return '—';
      return ids
        .map((id) => {
          const found = entryIndex.get(id);
          return found ? pathLabel(found.entry, found.contentType) : '…';
        })
        .join(', ');
    }
    if (value == null || value === '') return '—';
    return String(value);
  };

  const thumbFor = (entry: Entry) => {
    if (!imageField) return undefined;
    const id = linkIds(entry.fields[imageField.id])[0];
    return id ? assetIndex.get(id) : undefined;
  };

  if (!entries) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!entries.length) {
    return (
      <Typography sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
        No {contentType.name} entries yet.
      </Typography>
    );
  }

  const columnCount = (imageField ? 1 : 0) + 1 + summaryFields.length + (hasShowField ? 1 : 0) + 2;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          placeholder={`Search by ${displayFieldName.toLowerCase()}`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ flex: 1, maxWidth: { sm: 360 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
            htmlInput: { 'aria-label': `Search ${contentType.name} by ${displayFieldName.toLowerCase()}` },
          }}
        />
        {filterField && (
          <TextField
            select
            size="small"
            label={filterField.name}
            value={filterId}
            onChange={(e) => {
              setFilterId(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 240 }}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {filterOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        {hasShowField && (
          <TextField
            select
            size="small"
            label="Show in App"
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value as Visibility);
              setPage(0);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="shown">Shown in app</MenuItem>
            <MenuItem value="hidden">Not shown in app</MenuItem>
          </TextField>
        )}
      </Stack>

      {toggleError && (
        <Alert severity="error" onClose={() => setToggleError('')}>
          {toggleError}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {imageField && <TableCell sx={{ width: 72 }} />}
              <TableCell>{displayFieldName}</TableCell>
              {summaryFields.map((field) => (
                <TableCell key={field.id} sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {field.name}
                </TableCell>
              ))}
              {hasShowField && <TableCell sx={{ width: 110 }}>Show in App</TableCell>}
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Updated</TableCell>
              <TableCell align="right" sx={{ width: 96 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  No matches.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((entry) => {
              const thumb = thumbFor(entry);
              const label = pathLabel(entry, contentType);
              return (
                <TableRow key={entry.id} hover onClick={() => onEdit(entry)} sx={{ cursor: 'pointer' }}>
                  {imageField && (
                    <TableCell>
                      {thumb?.url ? (
                        <Box
                          component="img"
                          src={thumbUrl(thumb.url, 96)}
                          alt=""
                          loading="lazy"
                          sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <ImageIcon sx={{ color: 'text.disabled' }} />
                      )}
                    </TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 500 }}>{label}</TableCell>
                  {summaryFields.map((field) => (
                    <TableCell key={field.id} sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {formatValue(field, entry.fields[field.id])}
                    </TableCell>
                  ))}
                  {hasShowField && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        size="small"
                        checked={isShown(entry)}
                        disabled={entry.id in pendingShow}
                        onChange={(e) => toggleShow(entry, e.target.checked)}
                        slotProps={{ input: { 'aria-label': `Show ${label} in app` } }}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary' }}>
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        aria-label={`Edit ${label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(entry);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        aria-label={`Delete ${label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(entry);
                        }}
                        sx={{ '&:hover': { color: 'error.main' } }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={visible.length}
          page={currentPage}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
        />
      </TableContainer>
    </Stack>
  );
}
