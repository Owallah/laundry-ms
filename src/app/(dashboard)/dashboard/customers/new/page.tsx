"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          notes: form.notes.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Customer created!");
      router.push(`/dashboard/customers/${data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition bg-white";
  const labelClass = "block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5";

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">New Customer</h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
          Add a new customer to the system
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full name *</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Jane Mwangi"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone number *</label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
              placeholder="0712 345 678"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Address (optional)</label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Westlands, Nairobi"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Any special notes about this customer…"
            className={inputClass + " resize-none"}
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Link
            href="/dashboard/customers"
            className="px-5 py-2.5 text-sm font-medium border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving…" : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
