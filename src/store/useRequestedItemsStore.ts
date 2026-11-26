import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface RequestedServiceItem {
  id: string;
  storeId: string;
  serviceId?: number | null;
  serviceName?: string | null;
  catalogItemId?: number | null;
  catalogItemName?: string | null;
  name: string;
  image?: string | null;
  basePrice?: number | null;
  quantity: number;
  minQuantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  addOns: string[];
  notes?: string | null;
  customDetails?: string | null;
}

interface RequestedItemsState {
  items: RequestedServiceItem[];
  addItem: (item: Omit<RequestedServiceItem, 'id'>) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  updateCustomDetails: (itemId: string, details: string) => void;
  removeCatalogDesign: (itemId: string, fallbackServiceName?: string) => void;
  attachCatalogDesign: (
    itemId: string,
    design: { id: number; name: string; image_url?: string | null; sizes?: string[] | null; color?: string | null; price?: number | string | null }
  ) => void;
  updateItem: (itemId: string, updates: Partial<RequestedServiceItem>) => void;
  removeItem: (itemId: string) => void;
  clearStoreItems: (storeId: string) => void;
  clearAll: () => void;
  getStoreItems: (storeId: string) => RequestedServiceItem[];
}

function normalizeKey(str?: string | null): string {
  return (str || '').trim().toLowerCase();
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sA = [...a].sort();
  const sB = [...b].sort();
  return sA.every((val, idx) => val === sB[idx]);
}

export const useRequestedItemsStore = create<RequestedItemsState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const storeId = String(newItem.storeId);
        const minQty = Math.max(1, Number(newItem.minQuantity) || 1);
        const initialQty = Math.max(minQty, Number(newItem.quantity) || minQty);

        set((state) => {
          // Check if an identical configuration already exists
          const existingIndex = state.items.findIndex(
            (it) =>
              String(it.storeId) === storeId &&
              it.serviceId === newItem.serviceId &&
              it.catalogItemId === newItem.catalogItemId &&
              normalizeKey(it.selectedColor) === normalizeKey(newItem.selectedColor) &&
              normalizeKey(it.selectedSize) === normalizeKey(newItem.selectedSize) &&
              arraysEqual(it.addOns, newItem.addOns)
          );

          if (existingIndex > -1) {
            const updated = [...state.items];
            const curr = updated[existingIndex];
            updated[existingIndex] = {
              ...curr,
              quantity: curr.quantity + initialQty,
            };
            return { items: updated };
          }

          const requestedItem: RequestedServiceItem = {
            ...newItem,
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            storeId,
            minQuantity: minQty,
            quantity: initialQty,
            addOns: newItem.addOns || [],
          };

          // One service (and optionally one of its designs) per booking: a different pick replaces the shop's earlier one.
          return { items: [...state.items.filter((it) => String(it.storeId) !== storeId), requestedItem] };
        });
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items.map((it) => {
            if (it.id !== itemId) return it;
            const validQty = Math.max(it.minQuantity || 1, quantity);
            return { ...it, quantity: validQty };
          }),
        }));
      },

      updateNotes: (itemId, notes) => {
        set((state) => ({
          items: state.items.map((it) => (it.id === itemId ? { ...it, notes } : it)),
        }));
      },

      updateCustomDetails: (itemId, customDetails) => {
        set((state) => ({
          items: state.items.map((it) => (it.id === itemId ? { ...it, customDetails } : it)),
        }));
      },

      removeCatalogDesign: (itemId, fallbackServiceName) => {
        set((state) => ({
          items: state.items.map((it) => {
            if (it.id !== itemId) return it;
            const parentName = fallbackServiceName || it.serviceName || 'Custom Service';
            return {
              ...it,
              catalogItemId: null,
              catalogItemName: null,
              name: parentName,
              // Keep color/size/addons/quantity if applicable or reset
            };
          }),
        }));
      },

      attachCatalogDesign: (itemId, design) => {
        set((state) => ({
          items: state.items.map((it) => {
            if (it.id !== itemId) return it;
            return {
              ...it,
              catalogItemId: design.id,
              catalogItemName: design.name,
              name: design.name,
              image: design.image_url || it.image,
              selectedSize: design.sizes?.[0] || it.selectedSize || null,
              selectedColor: design.color || it.selectedColor || null,
              basePrice: design.price != null ? Number(design.price) : it.basePrice,
            };
          }),
        }));
      },

      updateItem: (itemId, updates) => {
        set((state) => ({
          items: state.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
        }));
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((it) => it.id !== itemId),
        }));
      },

      clearStoreItems: (storeId) => {
        set((state) => ({
          items: state.items.filter((it) => String(it.storeId) !== String(storeId)),
        }));
      },

      clearAll: () => {
        set({ items: [] });
      },

      getStoreItems: (storeId) => {
        return get().items.filter((it) => String(it.storeId) === String(storeId));
      },
    }),
    {
      name: 'sutura_requested_items',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
