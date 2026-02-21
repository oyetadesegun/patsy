export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  variants: StockVariant[];
  createdAt: string;
}

export interface StockVariant {
  size: string;
  color: string;
  quantity: number;
}

export const CLOTH_TYPES = [
  "Gown",
  "Suit",
  "Top",
  "Skirt",
  "Blouse",
  "Skirt and Blouse",
  "Trouser",
  "Short Gown",
  "Jump suit",
  "Other",
] as const;

export const SIZES = [
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "54",
  "56",
  "58",
  "60",
] as const;
