import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../lib/query-keys';
import { useShopItems } from './content';
import { getInventory, type InventoryRow } from '../../lib/shop-api';
import { type ShopProduct } from '../../lib/contentful';

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

/**
 * Shop items with their stock and per-size prices: Contentful products
 * joined with the inventory by itemId. Loading until both have arrived.
 */
export function useShopCatalog({ enabled = true } = {}) {
  const productsQuery = useShopItems({ enabled });
  const inventoryQuery = useInventory({ enabled });

  const data = useMemo(() => {
    if (!productsQuery.data || !inventoryQuery.data) return undefined;
    const byItem = new Map<string, InventoryRow[]>();
    inventoryQuery.data.forEach((row) => byItem.set(row.itemId, [...(byItem.get(row.itemId) ?? []), row]));
    return productsQuery.data.map((product) => combine(product, byItem.get(product.itemId) ?? []));
  }, [productsQuery.data, inventoryQuery.data]);

  return { data, isPending: enabled && (productsQuery.isPending || inventoryQuery.isPending) };
}
