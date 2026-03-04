"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Minus, Trash2, Printer, Search, ShoppingCart, User, Phone, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInventory } from "@/hooks/useInventory";
import { useSales } from "@/hooks/useSales";
import { CartItem, Sale } from "@/types/inventory";
import { useReactToPrint } from "react-to-print";
import { ReceiptPrint } from "@/components/ReceiptPrint";
import { formatNaira } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const POS = () => {
  const { role, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || (role !== "admin" && role !== "staff")) {
      router.replace("/");
    }
  }, [isAuthenticated, role, router]);

  const { items, allItems, searchQuery, setSearchQuery, filterType, setFilterType,
          filterColor, setFilterColor, filterSize, setFilterSize, updateItem } = useInventory();
  const { addSale, todaySales, todayRevenue, pendingDeposits } = useSales();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [staffName, setStaffName] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const addToCart = (inventoryItemId: string, name: string, imageUrl: string, type: string, size: string, unitPrice: number, availableQty: number) => {
    const existing = cart.find((c) => c.inventoryItemId === inventoryItemId && c.size === size);
    if (existing) {
      if (existing.quantity >= availableQty) return;
      setCart(cart.map((c) =>
        c.inventoryItemId === inventoryItemId && c.size === size
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, { inventoryItemId, name, imageUrl, type, size, quantity: 1, unitPrice, discount: 0 }]);
    }
  };

  const updateCartQty = (index: number, delta: number) => {
    setCart(cart.map((c, i) => {
      if (i !== index) return c;
      const newQty = Math.max(1, c.quantity + delta);
      return { ...c, quantity: newQty };
    }));
  };

  const updateCartDiscount = (index: number, discount: number) => {
    setCart(cart.map((c, i) => (i === index ? { ...c, discount: Math.min(100, Math.max(0, discount)) } : c)));
  };

  const updateCartPrice = (index: number, price: number) => {
    setCart(cart.map((c, i) => (i === index ? { ...c, unitPrice: Math.max(0, price) } : c)));
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const totalDiscount = cart.reduce((sum, c) => sum + (c.unitPrice * c.discount / 100) * c.quantity, 0);
  const grandTotal = subtotal - totalDiscount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const paid = paymentType === "full" ? grandTotal : amountPaid;
    const balance = grandTotal - paid;

    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 1);

    const sale = addSale({
      items: cart,
      subtotal,
      totalDiscount,
      grandTotal,
      amountPaid: paid,
      balance: Math.max(0, balance),
      paymentType,
      depositDeadline: paymentType === "deposit" ? deadline.toISOString() : undefined,
      customerName,
      customerPhone,
      soldBy: staffName,
      status: paymentType === "full" || balance <= 0 ? "completed" : "pending_balance",
    });

    // Deduct inventory
    cart.forEach((cartItem) => {
      const inv = allItems.find((i) => i.id === cartItem.inventoryItemId);
      if (inv) {
        const updatedVariants = inv.variants.map((v) =>
          v.size === cartItem.size ? { ...v, quantity: Math.max(0, v.quantity - cartItem.quantity) } : v
        );
        updateItem(inv.id, { variants: updatedVariants });
      }
    });

    setCompletedSale(sale);
    setShowReceipt(true);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setAmountPaid(0);
    setPaymentType("full");
  };

  const [pickerItem, setPickerItem] = useState<typeof items[0] | null>(null);

  if (!isAuthenticated || (role !== "admin" && role !== "staff")) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Slim stats bar */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-display font-bold">Point of Sale</h1>
            <p className="text-[10px] text-muted-foreground font-body">Selling as {user}</p>
          </div>
          <div className="flex gap-4 text-xs font-body">
            <div className="text-center">
              <p className="text-muted-foreground">Today&apos;s Sales</p>
              <p className="font-semibold text-foreground">{todaySales.length}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Revenue</p>
              <p className="font-semibold text-foreground">{formatNaira(todayRevenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Pending</p>
              <p className="font-semibold text-destructive">{pendingDeposits.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Browser */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 font-body"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36 font-body">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {(["Gown","Suit","Top","Skirt","Blouse","Skirt and Blouse","Trouser","Short Gown","Jump suit","Other"] as const).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Colour (e.g. Black, Red…)"
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                className="flex-1 font-body"
              />
              <Select value={filterSize} onValueChange={setFilterSize}>
                <SelectTrigger className="w-36 font-body">
                  <SelectValue placeholder="All sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {(["XS","S","M","L","XL","2XL","3XL","4XL","Free Size","6","8","10","12","14","16","18","20"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterColor || filterSize !== "all" || filterType !== "all" || searchQuery) && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-muted-foreground font-body">Active:</span>
                {searchQuery && <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-body">&quot;{searchQuery}&quot;</span>}
                {filterType !== "all" && <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-body">{filterType}</span>}
                {filterColor && <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-body">Color: {filterColor}</span>}
                {filterSize !== "all" && <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-body">Size: {filterSize}</span>}
                <button
                  onClick={() => { setSearchQuery(""); setFilterType("all"); setFilterColor(""); setFilterSize("all"); }}
                  className="text-[10px] text-destructive hover:underline font-body ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => {
              const totalQty = item.variants.reduce((s, v) => s + v.quantity, 0);
              if (totalQty === 0) return null;
              const inCart = cart.filter(c => c.inventoryItemId === item.id).reduce((s, c) => s + c.quantity, 0);
              return (
                <button
                  key={item.id}
                  onClick={() => setPickerItem(item)}
                  className="group bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-elevated hover:border-primary/40 transition-all text-left relative"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {inCart > 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shadow">
                        {inCart}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-display text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-[10px] text-primary font-semibold font-body mt-0.5">{formatNaira(item.price)}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{totalQty} in stock · {item.variants.filter(v => v.quantity > 0).length} variants</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart / Checkout */}
        <div className="bg-card border border-border rounded-xl p-4 h-fit sticky top-20 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold text-sm">Cart ({cart.length} items)</h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="ml-auto text-[10px] text-destructive hover:underline font-body">Clear</button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-body">Tap a product to add it</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {cart.map((item, i) => {
                const discounted = item.unitPrice * (1 - item.discount / 100);
                return (
                  <div key={i} className="flex gap-2 items-start bg-muted/40 rounded-lg p-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0">
                      <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">Size: {item.size}</p>
                      {/* Qty row */}
                      <div className="flex items-center gap-1 mt-1">
                        <button onClick={() => updateCartQty(i, -1)} className="bg-background border border-border rounded p-0.5 hover:bg-muted transition-colors"><Minus className="h-3 w-3" /></button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQty(i, 1)} className="bg-background border border-border rounded p-0.5 hover:bg-muted transition-colors"><Plus className="h-3 w-3" /></button>
                      </div>
                      {/* Price + Discount row */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-0.5 bg-background border border-border rounded px-1 py-0.5">
                          <span className="text-[10px] text-muted-foreground">₦</span>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => updateCartPrice(i, parseInt(e.target.value) || 0)}
                            className="w-16 text-[10px] font-medium bg-transparent outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 bg-background border border-border rounded px-1 py-0.5">
                          <Percent className="h-2.5 w-2.5 text-muted-foreground" />
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discount}
                            onChange={(e) => updateCartDiscount(i, parseInt(e.target.value) || 0)}
                            className="w-8 text-[10px] font-medium bg-transparent outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary">{formatNaira(discounted * item.quantity)}</p>
                      {item.discount > 0 && <p className="text-[10px] text-muted-foreground line-through">{formatNaira(item.unitPrice * item.quantity)}</p>}
                      <button onClick={() => removeFromCart(i)} className="mt-1.5 text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {cart.length > 0 && (
            <>
              {/* Totals */}
              <div className="border-t border-border pt-3 space-y-1 text-xs font-body">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(subtotal)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-{formatNaira(totalDiscount)}</span></div>}
                <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Total</span><span>{formatNaira(grandTotal)}</span></div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)" className="pl-8 h-8 text-xs" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number (optional)" className="pl-8 h-8 text-xs" />
                </div>
              </div>

              {/* Payment Type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Payment Method</Label>
                <div className="flex gap-2">
                  <Button variant={paymentType === "full" ? "default" : "outline"} size="sm" className="flex-1 text-xs" onClick={() => { setPaymentType("full"); setAmountPaid(grandTotal); }}>
                    Full Payment
                  </Button>
                  <Button variant={paymentType === "deposit" ? "default" : "outline"} size="sm" className="flex-1 text-xs" onClick={() => setPaymentType("deposit")}>
                    Deposit
                  </Button>
                </div>
                {paymentType === "deposit" && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Amount Paying Now</Label>
                    <Input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs mt-1"
                      placeholder="Amount paid"
                    />
                    {amountPaid > 0 && amountPaid < grandTotal && (
                      <p className="text-[10px] text-destructive mt-1">
                        Balance: {formatNaira(grandTotal - amountPaid)} — due in 1 month
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button onClick={handleCheckout} className="w-full font-body" size="lg" disabled={cart.length === 0 || (paymentType === "deposit" && amountPaid <= 0)}>
                Complete Sale · {formatNaira(grandTotal)}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Variant Picker Modal */}
      {pickerItem && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setPickerItem(null)}>
          <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Item header */}
            <div className="flex gap-3 p-4 border-b border-border">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image src={pickerItem.imageUrl} alt={pickerItem.name} fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-sm">{pickerItem.name}</p>
                <p className="text-xs text-muted-foreground font-body">{pickerItem.type}</p>
                <p className="text-primary font-bold text-sm font-body mt-0.5">{formatNaira(pickerItem.price)}</p>
              </div>
              <button onClick={() => setPickerItem(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                <Trash2 className="h-4 w-4 opacity-0" />✕
              </button>
            </div>

            {/* Variant picker */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Size &amp; Color</p>
              <div className="grid grid-cols-2 gap-2">
                {pickerItem.variants
                  .filter((v) => v.quantity > 0)
                  .map((v, vi) => {
                    const cartQty = cart.find(c => c.inventoryItemId === pickerItem.id && c.size === v.size)?.quantity ?? 0;
                    return (
                      <button
                        key={`${vi}-${v.size}-${v.color}`}
                        onClick={() => {
                          addToCart(pickerItem.id, pickerItem.name, pickerItem.imageUrl, pickerItem.type, v.size, pickerItem.price, v.quantity);
                          setPickerItem(null);
                        }}
                        className="flex flex-col items-start gap-1 bg-muted/60 hover:bg-primary hover:text-primary-foreground rounded-xl p-3 transition-all border border-transparent hover:border-primary text-left"
                      >
                        <span className="text-base font-display font-bold leading-none">Size: {v.size}</span>
                        <span className="text-[11px] font-body opacity-80">Color: {v.color}</span>
                        <span className="text-[10px] font-body mt-1">
                          {v.quantity} in stock{cartQty > 0 ? ` · ${cartQty} in cart` : ""}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {completedSale?.paymentType === "deposit" ? "Deposit Slip" : "Sales Receipt"}
            </DialogTitle>
          </DialogHeader>
          {completedSale && (
            <>
              <ReceiptPrint ref={receiptRef} sale={completedSale} />
              <Button onClick={() => handlePrint()} className="w-full gap-2 font-body">
                <Printer className="h-4 w-4" />
                Print {completedSale.paymentType === "deposit" ? "Deposit Slip" : "Receipt"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
