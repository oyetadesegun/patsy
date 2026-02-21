"use client"
import { Search, PackageOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddItemDialog } from "@/components/AddItemDialog";
import { InventoryCard } from "@/components/InventoryCard";
import { StatsBar } from "@/components/StatsBar";
import { useInventory } from "@/hooks/useInventory";
import { CLOTH_TYPES, SIZES, type InventoryItem } from "@/types/inventory";
import { useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function InventoryContent() {
  const { user, role, logout } = useAuth();
  const {
    items,
    inStockItems,
    outOfStockItems,
    allItems,
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
  } = useInventory();

  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold tracking-tight bg-primary bg-clip-text">
              Patsy Inventory
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold h-5">
              {role}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-bold leading-none">{user}</span>
              <button onClick={logout} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                Sign Out
              </button>
            </div>
            {isAdmin && <AddItemDialog onAdd={addItem} />}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <StatsBar items={allItems} totalPieces={totalItems} />

        {/* Search & Type Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items…"
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

        {/* Colour & Size Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Filter by colour (e.g. Black, Red…)"
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            className="font-body flex-1"
          />
          <Select value={filterSize} onValueChange={setFilterSize}>
            <SelectTrigger className="w-full sm:w-44 font-body">
              <SelectValue placeholder="All sizes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-muted/50 p-1 font-body">
              <TabsTrigger value="all" className="data-[state=active]:bg-white">
                All Items <Badge variant="secondary" className="ml-2 text-[10px] h-4">{items.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="in-stock" className="data-[state=active]:bg-white">
                In Stock <Badge variant="secondary" className="ml-2 text-[10px] h-4">{inStockItems.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="out-of-stock" className="data-[state=active]:bg-white">
                Out of Stock <Badge variant="secondary" className="ml-2 text-[10px] h-4">{outOfStockItems.length}</Badge>
              </TabsTrigger>
            </TabsList>
            
            {/* Search/Filter UI could go here but it's below in original */}
          </div>

          <TabsContent value="all" className="mt-0 ring-offset-background focus-visible:outline-none">
            {renderGrid(items)}
          </TabsContent>
          <TabsContent value="in-stock" className="mt-0">
            {renderGrid(inStockItems)}
          </TabsContent>
          <TabsContent value="out-of-stock" className="mt-0">
            {renderGrid(outOfStockItems)}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  </div>
  );

  function renderGrid(displayItems: InventoryItem[]) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground font-body">Loading inventory…</p>
        </div>
      );
    }
    return displayItems.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayItems.map((item, i) => (
          <InventoryCard 
            key={item.id} 
            item={item} 
            onDelete={deleteItem} 
            onUpdate={updateItem}
            onAdjust={adjustVariantQuantity}
            index={i} 
          />
        ))}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-xl border border-dashed border-border mt-6">
        <PackageOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-base font-semibold text-foreground font-display">No items found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[240px] font-body mx-auto">
          We couldn&apos;t find any items matching your current filters or tab.
        </p>
      </div>
    );
  }
}

export default function InventoryPage() {
  return <AuthWrapper />;
}

function AuthWrapper() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <InventoryContent /> : <LoginPage />;
}
