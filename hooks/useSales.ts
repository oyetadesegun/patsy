"use client";

import { useState, useEffect } from "react";
import type { Sale } from "@/types/inventory";

const SALES_KEY = "fashion-sales";

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

function loadSales(): Sale[] {
  if (!isBrowser) return []; // Return empty array on server
  
  try {
    const raw = localStorage.getItem(SALES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load sales from localStorage:", error);
    return [];
  }
}

function generateReceiptNumber(): string {
  const now = new Date();
  const prefix = "RCT";
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}-${datePart}-${rand}`;
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load sales on mount (client-side only)
  useEffect(() => {
    setSales(loadSales());
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever sales change
  useEffect(() => {
    if (!isLoading && isBrowser) {
      try {
        localStorage.setItem(SALES_KEY, JSON.stringify(sales));
      } catch (error) {
        console.error("Failed to save sales to localStorage:", error);
      }
    }
  }, [sales, isLoading]);

  const addSale = (sale: Omit<Sale, "id" | "receiptNumber" | "createdAt">): Sale => {
    const newSale: Sale = {
      ...sale,
      id: crypto.randomUUID ? crypto.randomUUID() : `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receiptNumber: generateReceiptNumber(),
      createdAt: new Date().toISOString(),
    };
    
    setSales((prev) => [newSale, ...prev]);
    return newSale;
  };

  const todaySales = sales.filter(
    (s) => new Date(s.createdAt).toDateString() === new Date().toDateString()
  );

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.amountPaid, 0);
  const pendingDeposits = sales.filter((s) => s.status === "pending_balance");

  // Helper function to get sales by date range
  const getSalesByDateRange = (startDate: Date, endDate: Date) => {
    return sales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });
  };

  // Helper function to get sales by customer
  const getSalesByCustomer = (customerName: string) => {
    return sales.filter((s) => 
      s.customerName?.toLowerCase().includes(customerName.toLowerCase())
    );
  };

  // Helper function to update a sale
  const updateSale = (id: string, updates: Partial<Sale>) => {
    setSales((prev) =>
      prev.map((sale) =>
        sale.id === id ? { ...sale, ...updates } : sale
      )
    );
  };

  // Helper function to delete a sale
  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((sale) => sale.id !== id));
  };

  return {
    sales,
    addSale,
    updateSale,
    deleteSale,
    todaySales,
    todayRevenue,
    pendingDeposits,
    getSalesByDateRange,
    getSalesByCustomer,
    isLoading,
  };
}