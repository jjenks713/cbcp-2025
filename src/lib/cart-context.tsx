import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// The shopping cart. Only shop item ids, chosen sizes and quantities are
// kept here (and in localStorage, so the cart survives reloads); names,
// prices and stock come from the shop items query when the cart is shown,
// so they're always current - see Features/Shop/use-cart-items.ts.
//
// The same item in two sizes is two lines, told apart by lineKey.

export type CartLine = { id: string; size?: string; quantity: number };

/** Identifies a cart line: the item, plus its size if it has one. */
export const lineKey = (line: { id: string; size?: string }) => (line.size ? `${line.id}::${line.size}` : line.id);

type CartContextValue = {
  lines: CartLine[];
  // Total quantity, for the nav badge
  count: number;
  add: (id: string, quantity?: number, size?: string) => void;
  // By lineKey; 0 removes the line
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  // How many of an item are in the cart across all its sizes (they share stock)
  quantityOf: (id: string) => number;
  // The cart drawer (opened from the nav, or after adding an item)
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  // The item drawer (product quick view) - the shop item id showing, if any
  itemDrawerId: string | null;
  openItem: (id: string) => void;
  closeItem: () => void;
};

const STORAGE_KEY = 'cbcp_cart';

const CartContext = createContext<CartContextValue | null>(null);

function loadLines(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed
          .filter((l) => typeof l?.id === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0)
          .map((l) => ({ id: l.id, quantity: l.quantity, ...(typeof l.size === 'string' && l.size && { size: l.size }) }))
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadLines);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemDrawerId, setItemDrawerId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage full/blocked - the cart still works for this visit.
    }
  }, [lines]);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity > 0
        ? prev.map((l) => (lineKey(l) === key ? { ...l, quantity } : l))
        : prev.filter((l) => lineKey(l) !== key)
    );
  }, []);

  const add = useCallback((id: string, quantity = 1, size?: string) => {
    const key = lineKey({ id, size });
    setLines((prev) =>
      prev.some((l) => lineKey(l) === key)
        ? prev.map((l) => (lineKey(l) === key ? { ...l, quantity: l.quantity + quantity } : l))
        : [...prev, { id, quantity, ...(size && { size }) }]
    );
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => lineKey(l) !== key)), []);
  const clear = useCallback(() => setLines([]), []);
  const quantityOf = useCallback(
    (id: string) => lines.filter((l) => l.id === id).reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openItem = useCallback((id: string) => setItemDrawerId(id), []);
  const closeItem = useCallback(() => setItemDrawerId(null), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      quantityOf,
      drawerOpen,
      openDrawer,
      closeDrawer,
      itemDrawerId,
      openItem,
      closeItem,
    }),
    [lines, add, setQuantity, remove, clear, quantityOf, drawerOpen, openDrawer, closeDrawer, itemDrawerId, openItem, closeItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
