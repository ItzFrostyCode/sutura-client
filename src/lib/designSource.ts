/** Where the design for an order comes from. Asked at the consultation and kept on the production order. */
export type DesignSource = 'shop_design' | 'customer_ready' | 'customer_redo' | 'none';

export const DESIGN_SOURCES: readonly { id: DesignSource; label: string; hint: string }[] = [
  { id: 'shop_design', label: 'The shop’s design', hint: 'One of the shop’s own designs' },
  { id: 'customer_ready', label: 'Customer’s finished design', hint: 'Make it exactly as given' },
  { id: 'customer_redo', label: 'Customer’s design, shop redoes it', hint: 'The shop makes a new version' },
  { id: 'none', label: 'No design yet', hint: 'To be decided' },
];

/** The same four choices, worded for the customer who is booking. */
export const CUSTOMER_DESIGN_SOURCES: readonly { id: DesignSource; label: string; hint: string }[] = [
  { id: 'shop_design', label: 'One of the shop’s designs', hint: 'I will choose from what the shop offers' },
  { id: 'customer_ready', label: 'I have my own finished design', hint: 'Make it exactly as I give it' },
  { id: 'customer_redo', label: 'I have an idea or a photo', hint: 'The shop makes a new version of it' },
  { id: 'none', label: 'Not sure yet', hint: 'We will talk about it at the shop' },
];

export const designSourceLabel = (id?: string | null): string | null => DESIGN_SOURCES.find((d) => d.id === id)?.label ?? null;
