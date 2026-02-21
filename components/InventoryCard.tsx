"use client"
import type { InventoryItem } from "@/types/inventory";
import { Trash2, Edit2, PlusCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddItemDialog } from "./AddItemDialog";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { useSettings } from "@/hooks/useSettings";

interface InventoryCardProps {
  item: InventoryItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<InventoryItem>) => void;
  onAdjust: (itemId: string, size: string, color: string, delta: number) => void;
  index: number;
}

export function InventoryCard({ item, onDelete, onUpdate, onAdjust, index }: InventoryCardProps) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [quickSize, setQuickSize] = useState("");
  const [quickColor, setQuickColor] = useState("Black");
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();
  const { sizes } = useSettings();

  const totalQty = (item.variants || []).reduce((sum, v) => sum + (v.quantity > 0 ? v.quantity : 0), 0);
  const activeVariants = (item.variants || []).filter(v => v.quantity > 0);

  const handleQuickAdjust = (delta: number) => {
    if (!quickSize || !quickColor) return;
    onAdjust(item.id, quickSize, quickColor, delta);
    if (delta > 0) {
      setQuickSize("");
      setQuickColor("Black");
    }
  };

  const handleImageClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't navigate if tapping on admin buttons
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    router.push(`/inventory/${item.id}`);
  };

  return (
    <div
      className="group bg-card rounded-lg border border-border overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in flex flex-col"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Tappable image — full area navigates to detail page on mobile */}
      <div
        className="relative aspect-3/4 overflow-hidden shrink-0 bg-muted cursor-pointer active:opacity-80 transition-opacity"
        onClick={handleImageClick}
        onTouchEnd={handleImageClick}
        role="link"
        aria-label={`View ${item.name} details`}
      >
        {/* Skeleton spinner while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-muted-foreground/20 border-t-primary/60" />
          </div>
        )}
        <img
          src={item.imageUrl}
          alt={item.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-linear-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Admin action buttons — stop propagation so they don't trigger nav */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-2">
            <AddItemDialog
              initialData={item}
              onUpdate={onUpdate}
              trigger={
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <Edit2 className="h-3.5 w-3.5 text-foreground" />
                </button>
              }
            />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground text-xs font-body">
            {item.type}
          </Badge>
        </div>
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-display text-sm font-semibold leading-tight truncate flex-1">{item.name}</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1 font-body">{totalQty} total pieces</p>

        {/* Active Variants Badge Cloud */}
        <div className="flex flex-wrap gap-1 mt-2.5">
          {activeVariants.slice(0, 4).map((v) => (
            <div
              key={`${v.size}-${v.color}`}
              className="inline-flex items-center text-[9px] font-medium font-body bg-muted text-muted-foreground rounded px-1.5 py-0.5 gap-1"
            >
              <span className="text-foreground font-bold">{v.size}</span>
              <span className="opacity-70">{v.color}</span>
              <span className="text-primary font-bold">{v.quantity}</span>
            </div>
          ))}
          {activeVariants.length > 4 && (
            <span className="text-[9px] text-muted-foreground font-medium pt-1">+{activeVariants.length - 4} more</span>
          )}
          {activeVariants.length === 0 && (
            <span className="text-[10px] text-muted-foreground italic">Out of stock</span>
          )}
        </div>

        {/* Quick Adjust */}
        {isAdmin && (
          <div className="mt-auto pt-3 space-y-1.5">
            <Input
              value={quickColor}
              onChange={(e) => setQuickColor(e.target.value)}
              placeholder="Color (e.g. Black)"
              className="h-8 text-xs w-full"
            />
            <div className="flex gap-1 items-center">
              <Select value={quickSize} onValueChange={setQuickSize}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => handleQuickAdjust(1)}
                disabled={!quickSize || !quickColor}
                className="p-1.5 rounded bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleQuickAdjust(-1)}
                disabled={!quickSize || !quickColor || !(item.variants || []).some(v => v.size === quickSize && v.color === quickColor)}
                className="p-1.5 rounded bg-muted text-foreground disabled:opacity-50 hover:bg-muted/90 transition-colors"
              >
                <MinusCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
