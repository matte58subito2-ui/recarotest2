import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // Unique identifier for the cart item
    categoryId: string; // e.g., 'Stadium', 'Motorsport'
    productName: string; // e.g., 'RECARO STADIUM SEAT'
    colorHex: string; // e.g., '#c41e1e'
    logoBlob: string | null; // Data URL or null
    logoPosition: string | null; // 'Headrest', 'Backrest', etc.
    price: number; // Final price per unit
    quantity: number; // How many units ordered
    originalPrice?: number; // Price before discount
    partnershipLevel?: 'Nessuna' | 'Logo' | 'Logo e Media';
    discountRate?: number; // e.g., 0.15 or 0.30

    // Additional configuration details
    material?: string;
    color?: string;
    accessories?: string[];
    heating?: boolean;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set) => ({
            items: [],
            addItem: (item) => set((state) => ({
                items: [...state.items, { ...item, id: crypto.randomUUID(), quantity: 1 }]
            })),
            removeItem: (id) => set((state) => ({
                items: state.items.filter((i) => i.id !== id)
            })),
            updateQuantity: (id, quantity) => set((state) => ({
                items: state.items.map((i) => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)
            })),
            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'recaro-cart-storage',
        }
    )
);
