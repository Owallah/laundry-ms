"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Plus, Loader2, X } from "lucide-react";
import type { InventoryCategory, InventoryUnit } from "@/types";

export default function AddInventoryModal() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "detergent" as InventoryCategory,
    unit: "kg" as InventoryUnit,
    current_stock: "",
    minimum_stock: "",
    unit_cost: "",
    supplier: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("inventory_items").insert({
        name: form.name,
        category: form.category,
        unit: form.unit,
        current_stock: parseFloat(form.current_stock) || 0,
        minimum_stock: parseFloat(form.minimum_stock) || 0,
        unit_cost: parseFloat(form.unit_cost) || null,
        supplier: form.supplier || null,
      });
      if (error) throw error;
      toast.success("Item added to inventory");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition bg-white";
  const labelClass = "block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Add Item
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Add Inventory Item</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-[var(--color-surface)] rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Item name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Ariel Detergent" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category *</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                    <option value="detergent">Detergent</option>
                    <option value="softener">Softener</option>
                    <option value="bleach">Bleach</option>
                    <option value="packaging">Packaging</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Unit *</label>
                  <select value={form.unit} onChange={(e) => set("unit", e.target.value)} className={inputClass}>
                    <option value="kg">kg</option>
                    <option value="litres">litres</option>
                    <option value="pieces">pieces</option>
                    <option value="rolls">rolls</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Current stock</label>
                  <input type="number" min="0" step="0.1" value={form.current_stock} onChange={(e) => set("current_stock", e.target.value)} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Min stock (alert)</label>
                  <input type="number" min="0" step="0.1" value={form.minimum_stock} onChange={(e) => set("minimum_stock", e.target.value)} placeholder="0" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Unit cost (KES)</label>
                  <input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Supplier</label>
                  <input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Supplier name" className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm font-medium border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] transition">Cancel</button>
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Adding…" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
