import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// The shopping cart. Only shop item ids and quantities are kept here (and
// in localStorage, so the cart survives reloads); names, prices and stock
// come from the shop items query when the cart is shown, so they're
// always current - see Features/Shop/use-cart-items.ts.

export type CartLine = { id: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  // Total quantity, for the nav badge
  count: number;
  add: (id: string, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  // The cart drawer (opened from the nav, or after adding an item)
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const STORAGE_KEY = 'cbcp_cart';

const CartContext = createContext<CartContextValue | null>(null);

function loadLines(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((l) => typeof l?.id === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadLines);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage full/blocked - the cart still works for this visit.
    }
  }, [lines]);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setLines((prev) =>
      quantity > 0 ? prev.map((l) => (l.id === id ? { ...l, quantity } : l)) : prev.filter((l) => l.id !== id)
    );
  }, []);

  const add = useCallback((id: string, quantity = 1) => {
    setLines((prev) =>
      prev.some((l) => l.id === id)
        ? prev.map((l) => (l.id === id ? { ...l, quantity: l.quantity + quantity } : l))
        : [...prev, { id, quantity }]
    );
  }, []);

  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [lines, add, setQuantity, remove, clear, drawerOpen, openDrawer, closeDrawer]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
