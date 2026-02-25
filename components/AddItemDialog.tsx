"use client"
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Camera, X } from "lucide-react";
import type { StockVariant, InventoryItem } from "@/types/inventory";
import { useSettings } from "@/hooks/useSettings";

interface AddItemDialogProps {
  onAdd?: (item: Omit<InventoryItem, "id" | "createdAt" | "quantity">) => void;
  onUpdate?: (id: string, updates: Partial<InventoryItem>) => void;
  initialData?: InventoryItem;
  trigger?: React.ReactNode;
}

export function AddItemDialog({ onAdd, onUpdate, initialData, trigger }: AddItemDialogProps) {
  const { clothTypes, sizes } = useSettings();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState(initialData?.type || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [variants, setVariants] = useState<StockVariant[]>(initialData?.variants || [{ size: "38", color: "Black", quantity: 1 }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);

    try {
      // Get auth params
      const authResponse = await fetch('/api/imagekit-auth');
      if (!authResponse.ok) throw new Error("Failed to get upload authorization");
      
      const { signature, token, expire } = await authResponse.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", `item-${Date.now()}`);
      formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "");
      formData.append("signature", signature);
      formData.append("expire", expire.toString());
      formData.append("token", token);

      const response = await fetch(`https://upload.imagekit.io/api/v1/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      setImageUrl(data.url);
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Image upload failed. Please try again.");
      setImageUrl(""); // Clear preview on failure
    } finally {
      setIsUploading(false);
    }
  };

  const addVariantRow = () => {
    const usedSizes = variants.map((s) => s.size);
    const nextSize = sizes.find((s) => !usedSizes.includes(s)) || sizes[0] || "38";
    setVariants([...variants, { size: nextSize, color: "Black", quantity: 1 }]);
  };

  const removeVariantRow = (index: number) => {
    if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof StockVariant, value: string | number) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const handleSubmit = () => {
    if (!name || !type || !imageUrl) return;
    
    if (initialData && onUpdate) {
      onUpdate(initialData.id, { name, type, imageUrl, variants });
    } else if (onAdd) {
      onAdd({ name, type, imageUrl, variants });
    }

    if (!initialData) {
      setName("");
      setType("");
      setImageUrl("");
      setVariants([{ size: "38", color: "", quantity: 1 }]);
    }
    setOpen(false);
  };

  const isValid = name && type && imageUrl && variants.every((v) => v.quantity >= 0 && v.color);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 font-body">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initialData ? "Edit Item" : "Add New Item"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Image Upload */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Photo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
            {imageUrl ? (
              <div className="relative group">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className={`w-full h-48 object-cover rounded-lg border border-border ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                {!isUploading && (
                  <button
                    onClick={() => setImageUrl("")}
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-foreground" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                <div className="bg-muted rounded-full p-3">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Take or upload photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tap to use camera or browse</p>
                </div>
              </button>
            )}
          </div>

          {/* Item Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Item Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Silk Evening Dress"
              className="mt-1.5"
            />
          </div>

          {/* Cloth Type */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Cloth Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {clothTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variants (Size & Color) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-muted-foreground">Variants (Color & Size)</Label>
              <button
                onClick={addVariantRow}
                className="text-xs text-primary hover:underline font-medium"
              >
                + Add row
              </button>
            </div>
            <div className="space-y-3">
              {variants.map((entry, i) => (
                <div key={i} className="border border-border rounded-xl p-3 bg-muted/20 space-y-2 relative">
                  {variants.length > 1 && (
                    <button
                      onClick={() => removeVariantRow(i)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pr-6">
                    Variant {i + 1}
                  </p>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Color</Label>
                    <Input
                      value={entry.color}
                      onChange={(e) => updateVariant(i, "color", e.target.value)}
                      placeholder="e.g. Black, Red, Navy..."
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Size</Label>
                      <Select value={entry.size} onValueChange={(v) => updateVariant(i, "size", v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sizes.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={entry.quantity}
                        onChange={(e) => updateVariant(i, "quantity", parseInt(e.target.value) || 0)}
                        placeholder="Qty"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={!isValid || isUploading} className="w-full font-body">
            {isUploading ? "Uploading..." : initialData ? "Save Changes" : "Add to Inventory"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
