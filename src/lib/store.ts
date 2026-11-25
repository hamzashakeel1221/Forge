import { create } from "zustand";
import { siteConfig } from "@/config/site.config";

export type CartItem = { id: string; name: string; price: number; colorway: string; qty: number };

type ForgeState = {
  colorIndex: number;
  setColorIndex: (i: number) => void;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (o: boolean) => void;
  addToCart: (item: Omit<CartItem, "qty">) => void;
  removeFromCart: (id: string) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
  loaded: boolean;
  setLoaded: (l: boolean) => void;
  /** last item added, used for toasts */
  lastAdded: { name: string; t: number } | null;
};

export const useForge = create<ForgeState>((set) => ({
  colorIndex: 0,
  setColorIndex: (i) => set({ colorIndex: Math.max(0, Math.min(siteConfig.colorways.length - 1, i)) }),
  cart: [],
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  addToCart: (item) =>
    set((st) => {
      const existing = st.cart.find((c) => c.id === item.id);
      const cart = existing
        ? st.cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
        : [...st.cart, { ...item, qty: 1 }];
      return { cart, lastAdded: { name: item.name, t: Date.now() } };
    }),
  removeFromCart: (id) => set((st) => ({ cart: st.cart.filter((c) => c.id !== id) })),
  activeSection: "hero",
  setActiveSection: (activeSection) => set({ activeSection }),
  loaded: false,
  setLoaded: (loaded) => set({ loaded }),
  lastAdded: null,
}));

export const colorwayById = (id: string) =>
  siteConfig.colorways.find((c) => c.id === id) ?? siteConfig.colorways[0];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: siteConfig.brand.currency, maximumFractionDigits: 0 }).format(n);
