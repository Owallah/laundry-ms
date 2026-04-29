import { createClient } from "@/lib/supabase/server";
import { formatKES } from "@/lib/utils";
import { AlertTriangle, Package } from "lucide-react";
import InventoryItemCard from "@/components/inventory/InventoryItemCard";
import AddInventoryModal from "@/components/inventory/AddInventoryModal";
import RestockModal from "@/components/inventory/RestockModal";
import type { InventoryItem } from "@/types";

export default async function InventoryPage() {
  const supabase = await createClient();

  const [{ data: items }, { data: recentTxns }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name"),
    supabase
      .from("inventory_transactions")
      .select(`*, item:inventory_items(name, unit), recorder:profiles(full_name)`)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const allItems = (items as InventoryItem[]) ?? [];
  const lowStock = allItems.filter(
    (i) => Number(i.current_stock) <= Number(i.minimum_stock)
  );

  const categories = [...new Set(allItems.map((i) => i.category))];

  const CATEGORY_LABELS: Record<string, string> = {
    detergent: "Detergents",
    softener: "Softeners",
    bleach: "Bleach",
    packaging: "Packaging",
    equipment: "Equipment",
    other: "Other",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Inventory</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
            {allItems.length} items tracked
          </p>
        </div>
        <AddInventoryModal />
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="card p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-amber-800 text-sm">
              {lowStock.length} item{lowStock.length > 1 ? "s" : ""} running low
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((item) => (
              <span
                key={item.id}
                className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg"
              >
                {item.name} — {item.current_stock} {item.unit} left
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items by category */}
        <div className="lg:col-span-2 space-y-5">
          {categories.map((cat) => {
            const catItems = allItems.filter((i) => i.category === cat);
            return (
              <div key={cat}>
                <h2 className="font-semibold text-[var(--color-text-secondary)] text-sm uppercase tracking-wide mb-3">
                  {CATEGORY_LABELS[cat] ?? cat}
                </h2>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <InventoryItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent transactions */}
        <div className="card overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentTxns && recentTxns.length > 0 ? (
              recentTxns.map((txn) => {
                const item = txn.item as { name: string; unit: string } | undefined;
                const isIn = Number(txn.quantity) > 0;
                return (
                  <div key={txn.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                        <span className="text-xs font-medium text-[var(--color-text-primary)] truncate max-w-[120px]">
                          {item?.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isIn ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {isIn ? "+" : ""}
                        {txn.quantity} {item?.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-[var(--color-text-tertiary)] capitalize">
                        {txn.type}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">
                        Balance: {txn.balance_after}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">
                No activity yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
