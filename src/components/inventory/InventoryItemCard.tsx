"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Package, Plus, Minus, Loader2 } from "lucide-react";
import type { InventoryItem } from "@/types";

export default function InventoryItemCard({ item }: { item: InventoryItem }) {
  const router = useRouter();
  const supabase = createClient();
  const [adjusting, setAdjusting] = useState(false);
  const [qty, setQty] = useState("");
  const [type, setType] = useState<"restock" | "usage" | "adjustment" | "waste">("restock");
  const [loading, setLoading] = useState(false);

  const isLow = Number(item.current_stock) <= Number(item.minimum_stock);
  const stockPct = item.minimum_stock > 0
    ? Math.min(100, (Number(item.current_stock) / (Number(item.minimum_stock) * 3)) * 100)
    : 100;

  async function handleAdjust() {
    const quantity = parseFloat(qty);
    if (!quantity || isNaN(quantity)) return toast.error("Enter a valid quantity");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const signedQty = type === "usage" || type === "waste" ? -Math.abs(quantity) : Math.abs(quantity);
      const balanceAfter = Number(item.current_stock) + signedQty;

      const { error } = await supabase.from("inventory_transactions").insert({
        item_id: item.id,
        type,
        quantity: signedQty,
        balance_after: balanceAfter,
        recorded_by: user?.id,
      });
      if (error) throw error;
      toast.success("Inventory updated");
      setAdjusting(false);
      setQty("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn(
      "card p-4 transition-all",
      isLow && "border-amber-200 bg-amber-50/50"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          isLow ? "bg-amber-100" : "bg-[var(--color-surface)]"
        )}>
          <Package className={cn("w-4 h-4", isLow ? "text-amber-600" : "text-[var(--color-text-tertiary)]")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{item.name}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={cn(
                "text-sm font-bold tabular-nums",
                isLow ? "text-amber-700" : "text-[var(--color-text-primary)]"
              )}>
                {item.current_stock}
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">{item.unit}</span>
            </div>
          </div>

          {/* Stock bar */}
          <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isLow ? "bg-amber-400" : "bg-brand-400"
              )}
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
            Min: {item.minimum_stock} {item.unit}
            {item.supplier && ` · ${item.supplier}`}
          </p>
        </div>

        <button
          onClick={() => setAdjusting(!adjusting)}
          className={cn(
            "flex-shrink-0 p-1.5 rounded-lg transition",
            adjusting
              ? "bg-brand-100 text-brand-700"
              : "hover:bg-[var(--color-surface)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {adjusting && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2">
          <div className="flex gap-1.5">
            {(["restock", "usage", "adjustment", "waste"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 text-[10px] font-medium py-1 rounded-lg transition capitalize",
                  type === t
                    ? "bg-brand-600 text-white"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={`Qty (${item.unit})`}
              className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
            />
            <button
              onClick={handleAdjust}
              disabled={loading}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
