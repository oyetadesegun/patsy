"use client"
import { Search, PackageOpen, Plus, Trash2, Edit2, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddItemDialog } from "@/components/AddItemDialog";
import { InventoryCard } from "@/components/InventoryCard";
import { StatsBar } from "@/components/StatsBar";
import { useInventory } from "@/hooks/useInventory";
import { CLOTH_TYPES } from "@/types/inventory";

const Index = () => {
  const {
    items,
    allItems,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    addItem,
    deleteItem,
    totalItems,
  } = useInventory();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Inventory</h1>
            <p className="text-xs text-muted-foreground font-body mt-0.5">Fashion Stock Management</p>
          </div>
          <AddItemDialog onAdd={addItem} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <StatsBar items={allItems} totalPieces={totalItems} />

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-body"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-44 font-body">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {CLOTH_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <InventoryCard key={item.id} item={item} onDelete={deleteItem} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-muted rounded-full p-4 w-fit mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold">No items yet</h3>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Add your first item to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
