"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/types/inventory";

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sales");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Error: ${response.status} - ${text}`);
      }
      const data = await response.json();
      setSales(data);
    } catch (error: any) {
      console.error("Failed to fetch sales:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const addSale = async (
    sale: Omit<Sale, "id" | "receiptNumber" | "createdAt">,
  ): Promise<Sale> => {
    // Generate receipt number locally for immediate display if needed,
    // but the server will also handle it or we can pass one.
    const tempReceipt = `RCT-${Date.now()}`;

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sale, receiptNumber: tempReceipt }),
      });
      const newSale = await response.json();
      setSales((prev) => [newSale, ...prev]);
      return newSale;
    } catch (error) {
      console.error("Failed to save sale:", error);
      throw error;
    }
  };

  const todaySales = sales.filter(
    (s) => new Date(s.createdAt).toDateString() === new Date().toDateString(),
  );

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.amountPaid, 0);
  const pendingDeposits = sales.filter((s) => s.status === "pending_balance");

  const getSalesByDateRange = (startDate: Date, endDate: Date) => {
    return sales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });
  };

  const updateSale = async (id: string, updates: Partial<Sale>) => {
    // For now, updating sales might also need an API route if we want to change payment status etc.
    // For this scope, let's stick to adding and fetching.
    setSales((prev) =>
      prev.map((sale) => (sale.id === id ? { ...sale, ...updates } : sale)),
    );
  };

  return {
    sales,
    addSale,
    updateSale,
    todaySales,
    todayRevenue,
    pendingDeposits,
    getSalesByDateRange,
    isLoading,
    refreshSales: fetchSales,
  };
}
