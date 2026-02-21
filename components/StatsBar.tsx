import { Package, Layers, TrendingUp } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

interface StatsBarProps {
  items: InventoryItem[];
  totalPieces: number;
}

export function StatsBar({ items, totalPieces }: StatsBarProps) {
  const uniqueTypes = new Set(items.map((i) => i.type)).size;

  const stats = [
    { label: "Total Items", value: items.length, icon: Package },
    { label: "Total Pieces", value: totalPieces, icon: TrendingUp },
    { label: "Categories", value: uniqueTypes, icon: Layers },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 shadow-card"
        >
          <div className="bg-muted rounded-full p-2">
            <stat.icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xl font-display font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
