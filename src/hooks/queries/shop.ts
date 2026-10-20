import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../lib/query-keys';
import { useShopItems } from './content';
import { getInventory, type InventoryRow } from '../../lib/shop-api';
import { getShopItemsPage, type ShopItemsPageParams, type ShopProduct } from '../../lib/contentful';

/** One buyable option of an item: a size (or the item itself), its stock and price. */
export type ShopVariant = {
  // undefined for an item without sizes
  size?: string;
  stock: number;
  price: number;
};

/**
 * A shop item as the shop pages use it: the Contentful product plus its
 * variants from the inventory. `stock` is the total across sizes (0 =
 * sold out), `price` the lowest variant price and `maxPrice` the highest,
 * so a card can show "From $X" when sizes cost different amounts.
 */
export type ShopItem = ShopProduct & {
  basePrice: number;
  variants: ShopVariant[];
  stock: number;
  maxPrice: number;
};

/** The variant for a size (or the only variant of an item without sizes). */
export const variantFor = (item: ShopItem, size?: string) =>
  item.variants.find((v) => (v.size ?? undefined) === (size || undefined));

// Stock changes as things sell, so refetch more often than Contentful content.
export const useInventory = ({ enabled = true } = {}) =>
  useQuery({ queryKey: queryKeys.shop.inventory(), queryFn: getInventory, enabled, staleTime: 30 * 1000 });

function combine(product: ShopProduct, rows: InventoryRow[]): ShopItem {
  const rowFor = (size: string | null) => rows.find((r) => r.size === size);
  // One variant per size listed in Contentful; a size with no stock row
  // yet counts as out of stock.
  const variants: ShopVariant[] = product.sizes.length
    ? product.sizes.map((size) => {
        const row = rowFor(size);
        return { size, stock: row?.stock ?? 0, price: row?.price ?? product.price };
      })
    : [{ stock: rowFor(null)?.stock ?? 0, price: rowFor(null)?.price ?? product.price }];
  const prices = variants.map((v) => v.price);
  return {
    ...product,
    basePrice: product.price,
    variants,
    stock: variants.reduce((sum, v) => sum + v.stock, 0),
    price: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

/** Each product joined with its stock rows (by itemId). */
function withInventory(products: ShopProduct[], inventory: InventoryRow[]): ShopItem[] {
  const byItem = new Map<string, InventoryRow[]>();
  inventory.forEach((row) => byItem.set(row.itemId, [...(byItem.get(row.itemId) ?? []), row]));
  return products.map((product) => combine(product, byItem.get(product.itemId) ?? []));
}

/**
 * Shop items with their stock and per-size prices: Contentful products
 * joined with the inventory by itemId. Loading until both have arrived.
 */
export function useShopCatalog({ enabled = true } = {}) {
  const productsQuery = useShopItems({ enabled });
  const inventoryQuery = useInventory({ enabled });

  const data = useMemo(
    () => (productsQuery.data && inventoryQuery.data ? withInventory(productsQuery.data, inventoryQuery.data) : undefined),
    [productsQuery.data, inventoryQuery.data]
  );

  return { data, isPending: enabled && (productsQuery.isPending || inventoryQuery.isPending) };
}

/**
 * One page of the shop grid (paged and sorted by Contentful), joined with
 * the inventory - which is small enough to load whole. The previous page
 * stays up while the next loads. Waits until there are categories to ask for.
 */
export function useShopCatalogPage(params: ShopItemsPageParams) {
  const pageQuery = useQuery({
    queryKey: queryKeys.content.shopItemsPage(params),
    queryFn: () => getShopItemsPage(params),
    enabled: params.categoryIds.length > 0,
    placeholderData: keepPreviousData,
  });
  const inventoryQuery = useInventory();

  const items = useMemo(
    () => (pageQuery.data && inventoryQuery.data ? withInventory(pageQuery.data.items, inventoryQuery.data) : undefined),
    [pageQuery.data, inventoryQuery.data]
  );

  return {
    items,
    total: pageQuery.data?.total ?? 0,
    isPending: pageQuery.isPending || inventoryQuery.isPending,
    isPlaceholderData: pageQuery.isPlaceholderData,
  };
}
