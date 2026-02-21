"use client";
import { useState, useEffect } from "react";
import {
  CLOTH_TYPES as DEFAULT_CLOTH_TYPES,
  SIZES as DEFAULT_SIZES,
} from "@/types/inventory";

const CLOTH_TYPES_KEY = "patsy_cloth_types";
const SIZES_KEY = "patsy_sizes";

function loadArr(key: string, fallback: readonly string[]): string[] {
  if (typeof window === "undefined") return [...fallback];
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...fallback];
}

export function useSettings() {
  const [clothTypes, setClothTypesState] = useState<string[]>(() =>
    loadArr(CLOTH_TYPES_KEY, DEFAULT_CLOTH_TYPES),
  );
  const [sizes, setSizesState] = useState<string[]>(() =>
    loadArr(SIZES_KEY, DEFAULT_SIZES),
  );

  // Sync to localStorage on change
  useEffect(() => {
    localStorage.setItem(CLOTH_TYPES_KEY, JSON.stringify(clothTypes));
  }, [clothTypes]);

  useEffect(() => {
    localStorage.setItem(SIZES_KEY, JSON.stringify(sizes));
  }, [sizes]);

  const addClothType = (type: string) => {
    const trimmed = type.trim();
    if (!trimmed || clothTypes.includes(trimmed)) return;
    setClothTypesState((prev) => [...prev, trimmed]);
  };

  const removeClothType = (type: string) => {
    setClothTypesState((prev) => prev.filter((t) => t !== type));
  };

  const addSize = (size: string) => {
    const trimmed = size.trim();
    if (!trimmed || sizes.includes(trimmed)) return;
    setSizesState((prev) => [...prev, trimmed]);
  };

  const removeSize = (size: string) => {
    setSizesState((prev) => prev.filter((s) => s !== size));
  };

  const resetClothTypes = () => {
    setClothTypesState([...DEFAULT_CLOTH_TYPES]);
  };

  const resetSizes = () => {
    setSizesState([...DEFAULT_SIZES]);
  };

  return {
    clothTypes,
    sizes,
    addClothType,
    removeClothType,
    addSize,
    removeSize,
    resetClothTypes,
    resetSizes,
  };
}
