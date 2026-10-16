import { request, withAuth } from './api';

// Stock and per-size prices from the API's inventory collection (see
// server/src/models/Inventory.js). Product details come from Contentful;
// hooks/queries/shop.ts combines the two.

export type InventoryRow = {
  itemId: string;
  // null for an item without sizes
  size: string | null;
  stock: number;
  // null = the item's price from Contentful
  price: number | null;
};

export type InventoryInput = Pick<InventoryRow, 'size' | 'stock' | 'price'>;

export const getInventory = () =>
  request<{ inventory: InventoryRow[] }>('/api/shop/inventory').then((r) => r.inventory);

export function createInventoryAdminApi(token: string | null) {
  const headers = withAuth(token);
  return {
    getItemInventory: (itemId: string) =>
      request<{ inventory: InventoryRow[] }>(`/api/admin/inventory/${encodeURIComponent(itemId)}`, { headers }).then(
        (r) => r.inventory
      ),
    saveItemInventory: (itemId: string, rows: InventoryInput[]) =>
      request<{ inventory: InventoryRow[] }>(`/api/admin/inventory/${encodeURIComponent(itemId)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ rows }),
      }).then((r) => r.inventory),
  };
}
