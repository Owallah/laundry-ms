"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Plus, Loader2, X, CalendarPlus } from "lucide-react";
import type { Profile } from "@/types";

// ── Schedule shift modal ──────────────────────────────────
export default function StaffShiftManager({ staff }: { staff: Profile[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    staff_id: "",
    shift_date: new Date().toISOString().split("T")[0],
    start_time: "08:00",
    end_time: "17:00",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.staff_id) return toast.error("Select a staff member");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("shifts").insert({
        ...form,
        status: "scheduled",
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success("Shift scheduled!");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule shift");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition bg-white";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
      >
        <CalendarPlus className="w-3.5 h-3.5" />
        Schedule Shift
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Schedule Shift</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-[var(--color-surface)] rounded-lg transition">
                <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Staff member *</label>
                <select value={form.staff_id} onChange={(e) => set("staff_id", e.target.value)} className={inputClass} required>
                  <option value="">Select staff…</option>
                  {staff.filter(s => s.is_active).map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} — {s.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Date *</label>
                <input type="date" value={form.shift_date} onChange={(e) => set("shift_date", e.target.value)} className={inputClass} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Start time *</label>
                  <input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">End time *</label>
                  <input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} className={inputClass} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes…" className={inputClass} />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm font-medium border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Saving…" : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
