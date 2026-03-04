export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  price: number;
  variants: StockVariant[];
  createdAt: string;
}
export interface CartItem {
  inventoryItemId: string;
  name: string;
  imageUrl: string;
  type: string;
  size: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage 0-100
}

export interface Sale {
  id: string;
  receiptNumber: string;
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  paymentType: "full" | "deposit";
  depositDeadline?: string; // ISO date
  customerName: string;
  customerPhone: string;
  soldBy: string;
  createdAt: string;
  status: "completed" | "pending_balance";
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
