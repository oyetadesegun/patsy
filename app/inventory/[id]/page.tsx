"use client";

import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle, MinusCircle, Package, Palette, Ruler, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AddItemDialog } from "@/components/AddItemDialog";

import { LoginPage } from "@/components/LoginPage";

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { allItems, adjustVariantQuantity, updateItem, deleteItem } = useInventory();
  const { role, isAuthenticated } = useAuth();
  const isAdmin = role === "admin";

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const item = allItems.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-display font-bold">Item not found</h2>
        <Button variant="ghost" className="mt-4 gap-2" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteItem(item.id);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Inventory</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <AddItemDialog 
                  initialData={item} 
                  onUpdate={updateItem}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      Edit Item
                    </Button>
                  }
                />
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 gap-2" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Item Image */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm aspect-3/4">
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Item Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">{item.type}</Badge>
              <h1 className="text-3xl font-display font-bold">{item.name}</h1>
              <p className="text-muted-foreground mt-2 font-body">Detailed stock breakdown by color and size.</p>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="font-display font-bold text-sm">Stock Variants</h3>
                <span className="text-xs font-body text-muted-foreground">
                  {(item.variants || []).reduce((sum, v) => sum + v.quantity, 0)} items total
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="px-4 py-3 font-bold"><div className="flex items-center gap-1.5"><Palette className="h-3 w-3" /> Color</div></th>
                      <th className="px-4 py-3 font-bold"><div className="flex items-center gap-1.5"><Ruler className="h-3 w-3" /> Size</div></th>
                      <th className="px-4 py-3 font-bold">Quantity</th>
                      {isAdmin && <th className="px-4 py-3 font-bold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(item.variants || []).length > 0 ? (
                      (item.variants || []).sort((a, b) => a.color.localeCompare(b.color) || a.size.localeCompare(b.size)).map((v, i) => (
                        <tr key={`${v.color}-${v.size}`} className="text-sm hover:bg-muted/5 transition-colors">
                          <td className="px-4 py-3 font-medium">{v.color}</td>
                          <td className="px-4 py-3 text-muted-foreground font-body">{v.size}</td>
                          <td className="px-4 py-3">
                            <Badge variant={v.quantity > 0 ? "secondary" : "outline"} className={v.quantity === 0 ? "text-muted-foreground border-dashed" : ""}>
                              {v.quantity} in stock
                            </Badge>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => adjustVariantQuantity(item.id, v.size, v.color, -1)}
                                  className="p-1 rounded-full hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-30"
                                  disabled={v.quantity === 0}
                                >
                                  <MinusCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => adjustVariantQuantity(item.id, v.size, v.color, 1)}
                                  className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors"
                                >
                                  <PlusCircle className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 4 : 3} className="px-4 py-10 text-center text-muted-foreground italic text-sm">
                          No variants defined for this item.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
