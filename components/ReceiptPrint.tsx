import { formatDateTime, formatNaira } from "@/lib/format";
import type { Sale } from "@/types/inventory";
// import { formatNaira, formatDateTime } from "@/lib/format";
import { forwardRef } from "react";

interface ReceiptPrintProps {
  sale: Sale;
  storeName?: string;
}

export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptPrintProps>(
  ({ sale, storeName = "Fashion Store" }, ref) => {
    const isDeposit = sale.paymentType === "deposit";

    return (
      <div ref={ref} className="p-6 bg-white text-black font-body text-sm max-w-[380px] mx-auto print:max-w-none">
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">{storeName}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {isDeposit ? "DEPOSIT SLIP" : "SALES RECEIPT"}
          </p>
          <p className="text-xs text-gray-500">Receipt #: {sale.receiptNumber}</p>
          <p className="text-xs text-gray-500">{formatDateTime(sale.createdAt)}</p>
        </div>

        {/* Customer Info */}
        {sale.customerName && (
          <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
            <p className="text-xs"><span className="font-semibold">Customer:</span> {sale.customerName}</p>
            {sale.customerPhone && (
              <p className="text-xs"><span className="font-semibold">Phone:</span> {sale.customerPhone}</p>
            )}
            <p className="text-xs"><span className="font-semibold">Served by:</span> {sale.soldBy || "Staff"}</p>
          </div>
        )}

        {/* Items */}
        <table className="w-full text-xs mb-3">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1 font-semibold">Item</th>
              <th className="text-center py-1 font-semibold">Sz</th>
              <th className="text-center py-1 font-semibold">Qty</th>
              <th className="text-right py-1 font-semibold">Price</th>
              <th className="text-right py-1 font-semibold">Disc</th>
              <th className="text-right py-1 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => {
              const discountedPrice = item.unitPrice * (1 - item.discount / 100);
              const lineTotal = discountedPrice * item.quantity;
              return (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1 truncate max-w-[80px]">{item.name}</td>
                  <td className="text-center py-1">{item.size}</td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1">{formatNaira(item.unitPrice)}</td>
                  <td className="text-right py-1">{item.discount}%</td>
                  <td className="text-right py-1">{formatNaira(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Subtotal:</span>
            <span>{formatNaira(sale.subtotal)}</span>
          </div>
          {sale.totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-red-600">
              <span>Discount:</span>
              <span>-{formatNaira(sale.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1">
            <span>Grand Total:</span>
            <span>{formatNaira(sale.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Amount Paid:</span>
            <span>{formatNaira(sale.amountPaid)}</span>
          </div>
          {isDeposit && sale.balance > 0 && (
            <div className="flex justify-between text-xs font-semibold text-red-600">
              <span>Balance Due:</span>
              <span>{formatNaira(sale.balance)}</span>
            </div>
          )}
        </div>

        {/* Deposit Terms */}
        {isDeposit && (
          <div className="mt-4 border border-gray-300 rounded p-2 bg-gray-50">
            <p className="text-xs font-bold text-center mb-1">DEPOSIT TERMS & CONDITIONS</p>
            <ol className="text-[10px] text-gray-700 list-decimal list-inside space-y-0.5">
              <li>Outstanding balance must be paid within <strong>1 month</strong> from the date of this deposit.</li>
              <li>Failure to pay within 1 month may result in forfeiture of goods and deposit.</li>
              <li><strong>We do NOT offer cash refunds on deposits.</strong> Store credit may be issued at management's discretion.</li>
              <li>Please retain this slip as proof of deposit.</li>
            </ol>
            {sale.depositDeadline && (
              <p className="text-[10px] font-bold text-center mt-2 text-red-600">
                PAYMENT DEADLINE: {new Date(sale.depositDeadline).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-4 border-t border-dashed border-gray-400 pt-3">
          <p className="text-[10px] text-gray-500">Thank you for shopping with us!</p>
          <p className="text-[10px] text-gray-400 mt-1">Powered by {storeName}</p>
        </div>
      </div>
    );
  }
);

ReceiptPrint.displayName = "ReceiptPrint";
