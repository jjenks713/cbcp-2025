import { useCallback, useMemo } from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import { useAuth } from '../../lib/auth-context';
import { queryKeys } from '../../lib/query-keys';
import { createAdminApi, type Asset, type Entry } from '../../lib/admin-contentful';
import { createInventoryAdminApi, type InventoryInput, type InventoryRow } from '../../lib/shop-api';

// Admin panel data (the API's Contentful Management routes). Mutations
// write their result straight into the cached lists instead of refetching,
// and mark the public site's content stale so it picks up the edit next
// time it's shown.

function useAdminApi() {
  const { token } = useAuth();
  return useMemo(() => createAdminApi(token), [token]);
}

export function useContentTypes() {
  const api = useAdminApi();
  return useQuery({ queryKey: queryKeys.admin.contentTypes(), queryFn: api.getContentTypes });
}

export function useAssets() {
  const api = useAdminApi();
  return useQuery({ queryKey: queryKeys.admin.assets(), queryFn: api.getAssets });
}

/**
 * Entries for several content types at once - the active tab's plus the
 * types it links to. Each type is its own cached query, so switching tabs
 * reuses what's already loaded.
 */
export function useEntriesByType(contentTypeIds: string[]) {
  const api = useAdminApi();
  // Stable while the ids are, so the combined result (and entriesByType)
  // only changes when the underlying data does.
  const combine = useCallback(
    (results: UseQueryResult<Entry[]>[]) => ({
      // undefined while that type is still loading
      entriesByType: Object.fromEntries(contentTypeIds.map((id, i) => [id, results[i]?.data])) as Record<
        string,
        Entry[] | undefined
      >,
      error: results.find((r) => r.error)?.error ?? null,
      refetch: () => results.forEach((r) => r.refetch()),
    }),
    [contentTypeIds]
  );
  return useQueries({
    queries: contentTypeIds.map((id) => ({
      queryKey: queryKeys.admin.entries(id),
      queryFn: () => api.getEntries(id),
    })),
    combine,
  });
}

/** Replaces an entry in its type's cached list, or adds it at the top if new. */
function storeEntry(queryClient: QueryClient, contentTypeId: string, saved: Entry) {
  queryClient.setQueryData<Entry[]>(queryKeys.admin.entries(contentTypeId), (list: Entry[] = []) =>
    list.some((e) => e.id === saved.id) ? list.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...list]
  );
}

const markSiteContentStale = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: queryKeys.content.all });

type SaveEntryInput = {
  contentTypeId: string;
  // Omitted for a new entry
  entryId?: string;
  fields: Entry['fields'];
};

/** Creates (no entryId) or updates an entry - forms, bulk add and the Show in App switch. */
export function useSaveEntry() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentTypeId, entryId, fields }: SaveEntryInput) =>
      entryId ? api.updateEntry(contentTypeId, entryId, fields) : api.createEntry(contentTypeId, fields),
    onSuccess: (saved, { contentTypeId }) => {
      storeEntry(queryClient, contentTypeId, saved);
      markSiteContentStale(queryClient);
    },
  });
}

export function useDeleteEntry() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentTypeId, entryId }: { contentTypeId: string; entryId: string }) =>
      api.deleteEntry(contentTypeId, entryId),
    onSuccess: (_, { contentTypeId, entryId }) => {
      queryClient.setQueryData<Entry[]>(queryKeys.admin.entries(contentTypeId), (list: Entry[] = []) =>
        list.filter((e) => e.id !== entryId)
      );
      markSiteContentStale(queryClient);
    },
  });
}

export function useUploadAsset() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) => api.uploadAsset(file, title),
    onSuccess: (asset) => queryClient.setQueryData<Asset[]>(queryKeys.admin.assets(), (list: Asset[] = []) => [asset, ...list]),
  });
}

// ---- Stock (inventory) ----------------------------------------------------

function useInventoryAdminApi() {
  const { token } = useAuth();
  return useMemo(() => createInventoryAdminApi(token), [token]);
}

/** One shop item's stock rows (by its itemId). */
export function useItemInventory(itemId: string | undefined, { enabled = true } = {}) {
  const api = useInventoryAdminApi();
  return useQuery({
    queryKey: queryKeys.admin.inventory(itemId ?? ''),
    queryFn: () => api.getItemInventory(itemId as string),
    enabled: enabled && Boolean(itemId),
  });
}

/** Saves an item's stock rows; refreshes the shop's stock so it shows straight away. */
export function useSaveInventory() {
  const api = useInventoryAdminApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, rows }: { itemId: string; rows: InventoryInput[] }) => api.saveItemInventory(itemId, rows),
    onSuccess: (saved, { itemId }) => {
      queryClient.setQueryData<InventoryRow[]>(queryKeys.admin.inventory(itemId), saved);
      queryClient.invalidateQueries({ queryKey: queryKeys.shop.all });
    },
  });
}
