"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ArrowLeft, Plus, Minus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventory } from "@/hooks/useInventory";
import { CLOTH_TYPES } from "@/types/inventory";
import { formatNaira } from "@/lib/format";
import type { InventoryItem } from "@/types/inventory";

interface ShopCartItem {
  itemId: string;
  name: string;
  imageUrl: string;
  size: string;
  quantity: number;
  price: number;
}

const Shop = () => {
  const { items, searchQuery, setSearchQuery, filterType, setFilterType } = useInventory();
  const [cart, setCart] = useState<ShopCartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const addToCart = (item: InventoryItem, size: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id && c.size === size);
      if (existing) {
        return prev.map((c) =>
          c.itemId === item.id && c.size === size ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { itemId: item.id, name: item.name, imageUrl: item.imageUrl, size, quantity: 1, price: item.price }];
    });
  };

  const updateCartQty = (itemId: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.itemId === itemId && c.size === size ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const availableItems = items.filter((i) => i.variants.some((v) => v.quantity > 0));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" passHref>
              <Button variant="ghost" size="icon" asChild>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Shop</h1>
              <p className="text-xs text-muted-foreground font-body mt-0.5">Browse our collection</p>
            </div>
          </div>
          <Button variant="outline" className="relative gap-2 font-body" onClick={() => setCartOpen(true)}>
            <ShoppingBag className="h-4 w-4" />
            Bag
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 font-body"
          />
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

        {/* Product Grid */}
        {availableItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableItems.map((item) => {
              const totalQty = item.variants.reduce((s, v) => s + v.quantity, 0);
              return (
                <div
                  key={item.id}
                  className="group bg-card rounded-lg border border-border overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground text-xs font-body">
                        {item.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3.5">
                    <h3 className="font-display text-sm font-semibold truncate">{item.name}</h3>
                    <p className="text-sm font-semibold text-primary mt-1 font-body">{formatNaira(item.price)}</p>
                    <p className="text-[10px] text-muted-foreground font-body mt-0.5">{totalQty} in stock</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display text-lg font-semibold">No items available</h3>
            <p className="text-sm text-muted-foreground font-body mt-1">Check back soon for new arrivals</p>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-30 bg-foreground/50 backdrop-blur-sm flex items-end sm:items-center justify-center" 
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-card w-full sm:max-w-lg sm:rounded-lg overflow-hidden max-h-[85vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square">
              <Image
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 500px"
              />
              <button 
                onClick={() => setSelectedItem(null)} 
                className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Badge variant="secondary" className="font-body text-xs mb-2">{selectedItem.type}</Badge>
                <h2 className="font-display text-xl font-bold">{selectedItem.name}</h2>
                <p className="text-lg font-semibold text-primary font-body mt-1">{formatNaira(selectedItem.price)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground font-body mb-2">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.variants.filter((v) => v.quantity > 0).map((v) => (
                    <Button
                      key={v.size}
                      variant="outline"
                      size="sm"
                      className="font-body text-xs"
                      onClick={() => {
                        addToCart(selectedItem, v.size);
                        setSelectedItem(null);
                        setCartOpen(true);
                      }}
                    >
                      {v.size} <span className="text-muted-foreground ml-1">({v.quantity})</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm flex justify-end" 
          onClick={() => setCartOpen(false)}
        >
          <div 
            className="bg-card w-full max-w-sm h-full overflow-y-auto shadow-xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Your Bag ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="p-10 text-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-body">Your bag is empty</p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-3">
                  {cart.map((c) => (
                    <div key={`${c.itemId}-${c.size}`} className="flex gap-3 items-center">
                      <div className="relative h-16 w-12 flex-shrink-0">
                        <Image
                          src={c.imageUrl}
                          alt={c.name}
                          fill
                          className="object-cover rounded"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground font-body">Size: {c.size}</p>
                        <p className="text-xs font-semibold text-primary font-body">{formatNaira(c.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => updateCartQty(c.itemId, c.size, -1)} 
                          className="h-7 w-7 rounded border border-border flex items-center justify-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-body w-6 text-center">{c.quantity}</span>
                        <button 
                          onClick={() => updateCartQty(c.itemId, c.size, 1)} 
                          className="h-7 w-7 rounded border border-border flex items-center justify-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-5 border-t border-border space-y-3">
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatNaira(cartTotal)}</span>
                  </div>
                  <Button className="w-full gap-2 font-body" disabled>
                    Checkout <ChevronRight className="h-4 w-4" />
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground font-body">Checkout coming soon</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;