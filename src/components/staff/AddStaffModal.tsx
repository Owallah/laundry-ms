"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UserPlus, Loader2, X } from "lucide-react";
import type { StaffRole } from "@/types";

export default function AddStaffModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "attendant" as StaffRole,
    password: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add staff");
      toast.success(`${form.full_name} added to team!`);
      setOpen(false);
      setForm({ full_name: "", email: "", phone: "", role: "attendant", password: "" });
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add staff");
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
        <UserPlus className="w-4 h-4" />
        Add Staff
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Add Staff Member</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-[var(--color-surface)] rounded-lg transition">
                <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Full name *</label>
                <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required placeholder="John Kamau" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="john@jamari.co.ke" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Phone</label>
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XX XXX XXX" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Role *</label>
                  <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass} required>
                    <option value="attendant">Attendant</option>
                    <option value="driver">Driver</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Temporary password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className={inputClass}
                />
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Staff should change this on first login
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm font-medium border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Adding…" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
