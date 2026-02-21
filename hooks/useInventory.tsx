"use client"
import { useState, useEffect } from "react";
import type { InventoryItem } from "@/types/inventory";

const STORAGE_KEY = "fashion-inventory";

function loadItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addItem = async (item: Omit<InventoryItem, "id" | "createdAt">) => {
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const newItem = await response.json();
      setItems((prev) => [newItem, ...prev]);
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const currentItem = items.find(i => i.id === id);
      if (!currentItem) return;

      const response = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentItem, ...updates }),
      });
      const updatedItem = await response.json();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const adjustVariantQuantity = async (itemId: string, sizeLabel: string, colorLabel: string, delta: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const variantExists = item.variants.some((v) => v.size === sizeLabel && v.color === colorLabel);
    let newVariants;

    if (variantExists) {
      newVariants = item.variants.map((v) =>
        v.size === sizeLabel && v.color === colorLabel ? { ...v, quantity: Math.max(0, v.quantity + delta) } : v
      );
    } else if (delta > 0) {
      newVariants = [...item.variants, { size: sizeLabel, color: colorLabel, quantity: delta }];
    } else {
      return;
    }

    await updateItem(itemId, { variants: newVariants });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalItems = items.reduce(
    (sum, item) => sum + (item.variants || []).reduce((s, v) => s + (v.quantity > 0 ? v.quantity : 0), 0),
    0
  );

  const inStockItems = filteredItems.filter((item) =>
    (item.variants || []).some((v) => v.quantity > 0)
  );
  const outOfStockItems = filteredItems.filter((item) =>
    !(item.variants || []).some((v) => v.quantity > 0)
  );

  return {
    items: filteredItems,
    inStockItems,
    outOfStockItems,
    allItems: items,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    addItem,
    deleteItem,
    updateItem,
    adjustVariantQuantity,
    totalItems,
    isLoading,
    refreshItems: fetchItems,
  };
}
