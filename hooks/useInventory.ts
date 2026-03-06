"use client";
import { useState, useEffect, useCallback } from "react";
import type { InventoryItem } from "@/types/inventory";
import {
  saveOfflineOperation,
  getOfflineOperations,
  deleteOfflineOperation,
  updateOfflineOperation,
  OfflineOperation,
} from "@/lib/offline-storage";

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, _setSearchQuery] = useState("");
  const setSearchQuery = (val: string) => _setSearchQuery(val.trimStart());
  const [filterType, setFilterType] = useState("all");
  const [filterColor, setFilterColor] = useState("");
  const [filterSize, setFilterSize] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/inventory");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Error: ${response.status} - ${text}`);
      }
      const data = await response.json();
      setItems(data);
    } catch (error: any) {
      console.error("Failed to fetch items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processOfflineQueue = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    const ops = await getOfflineOperations();
    const pendingOps = ops.filter(
      (op) => op.status === "pending" || op.status === "failed",
    );

    if (pendingOps.length === 0) return;

    setIsSyncing(true);
    for (const op of pendingOps) {
      if (!navigator.onLine) break;

      try {
        await updateOfflineOperation({ ...op, status: "processing" });

        let response;
        if (op.type === "add") {
          response = await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(op.data),
          });
        } else if (op.type === "update") {
          response = await fetch("/api/inventory", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(op.data),
          });
        } else if (op.type === "delete") {
          response = await fetch("/api/inventory", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: op.itemId }),
          });
        }

        if (response?.ok) {
          await deleteOfflineOperation(op.id);
        } else {
          throw new Error("Sync failed");
        }
      } catch (error) {
        console.error("Failed to sync operation:", op.id, error);
        await updateOfflineOperation({ ...op, status: "failed" });
      }
    }
    setIsSyncing(false);
    fetchItems(); // Refresh to ensure server state is captured
  }, [isSyncing]);

  useEffect(() => {
    // Single initialization: fetch items then process queue
    const init = async () => {
      await fetchItems();
      await processOfflineQueue();
    };
    init();

    const handleOnline = () => processOfflineQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [processOfflineQueue]);

  const addItem = async (item: Omit<InventoryItem, "id" | "createdAt">) => {
    const tempId = `temp-${Date.now()}`;
    const newItem = {
      ...item,
      id: tempId,
      createdAt: new Date().toISOString(),
    } as InventoryItem;

    // Optimistic update
    setItems((prev) => [newItem, ...prev]);

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add item");
      }

      const data = await response.json();
      // Replace temp item with real one
      setItems((prev) => prev.map((i) => (i.id === tempId ? data : i)));
    } catch (error: any) {
      console.warn(
        "API Error or Offline: Queueing add operation",
        error.message,
      );
      // If it was a real API error (not network), we might want to revert the optimistic update
      // but if it's offline, we keep it and queue.
      if (!navigator.onLine || error.message === "Failed to fetch") {
        await saveOfflineOperation({
          id: tempId,
          type: "add",
          data: item,
          status: "pending",
          createdAt: Date.now(),
        });
      } else {
        // Real server error, remove the optimistic item
        setItems((prev) => prev.filter((i) => i.id !== tempId));
        alert(`Error: ${error.message}`);
      }
    }
  };

  const deleteItem = async (id: string) => {
    const originalItems = [...items];
    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const response = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      console.warn("Offline: Queueing delete operation");
      await saveOfflineOperation({
        id: `del-${Date.now()}`,
        type: "delete",
        itemId: id,
        data: { id },
        status: "pending",
        createdAt: Date.now(),
      });
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const currentItem = items.find((i) => i.id === id);
    if (!currentItem) return;

    const updatedItem = { ...currentItem, ...updates };
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updatedItem : item)),
    );

    try {
      const response = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems((prev) => prev.map((item) => (item.id === id ? data : item)));
    } catch (error) {
      console.warn("Offline: Queueing update operation");
      await saveOfflineOperation({
        id: `upd-${Date.now()}`,
        type: "update",
        itemId: id,
        data: updatedItem,
        status: "pending",
        createdAt: Date.now(),
      });
    }
  };

  const adjustVariantQuantity = async (
    itemId: string,
    sizeLabel: string,
    colorLabel: string,
    delta: number,
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const variantExists = item.variants.some(
      (v) => v.size === sizeLabel && v.color === colorLabel,
    );
    let newVariants;

    if (variantExists) {
      newVariants = item.variants.map((v) =>
        v.size === sizeLabel && v.color === colorLabel
          ? { ...v, quantity: Math.max(0, v.quantity + delta) }
          : v,
      );
    } else if (delta > 0) {
      newVariants = [
        ...item.variants,
        { size: sizeLabel, color: colorLabel, quantity: delta },
      ];
    } else {
      return;
    }

    await updateItem(itemId, { variants: newVariants });
  };

  const sortByName = (arr: InventoryItem[]) =>
    [...arr].sort((a, b) => a.name.localeCompare(b.name));

  const filteredItems = sortByName(
    items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || item.type === filterType;
      const matchesColor =
        !filterColor ||
        (item.variants || []).some((v) =>
          v.color.toLowerCase().includes(filterColor.toLowerCase()),
        );
      const matchesSize =
        filterSize === "all" ||
        (item.variants || []).some((v) => v.size === filterSize);
      return matchesSearch && matchesType && matchesColor && matchesSize;
    }),
  );

  const totalItems = items.reduce(
    (sum, item) =>
      sum +
      (item.variants || []).reduce(
        (s, v) => s + (v.quantity > 0 ? v.quantity : 0),
        0,
      ),
    0,
  );

  const inStockItems = filteredItems.filter((item) =>
    (item.variants || []).some((v) => v.quantity > 0),
  );
  const outOfStockItems = filteredItems.filter(
    (item) => !(item.variants || []).some((v) => v.quantity > 0),
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
    filterColor,
    setFilterColor,
    filterSize,
    setFilterSize,
    addItem,
    deleteItem,
    updateItem,
    adjustVariantQuantity,
    totalItems,
    isLoading,
    refreshItems: fetchItems,
  };
}
