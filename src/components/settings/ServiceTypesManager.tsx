"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatKES } from "@/lib/utils";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Loader2, X, Check, Clock } from "lucide-react";
import type { ServiceType } from "@/types";

interface Props {
  services: ServiceType[];
  canEdit: boolean;
}

interface EditState {
  id: string;
  name: string;
  description: string;
  price_per_kg: string;
  turnaround_hours: string;
}

export default function ServiceTypesManager({ services, canEdit }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const blankForm = {
    name: "",
    description: "",
    price_per_kg: "",
    turnaround_hours: "24",
  };
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState<EditState | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setEdit = (k: string, v: string) =>
    setEditForm((f) => f ? { ...f, [k]: v } : f);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("service_types").insert({
        name: form.name,
        description: form.description || null,
        price_per_kg: parseFloat(form.price_per_kg),
        turnaround_hours: parseInt(form.turnaround_hours),
      });
      if (error) throw error;
      toast.success("Service type added");
      setForm(blankForm);
      setShowAdd(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add service");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("service_types")
        .update({
          name: editForm.name,
          description: editForm.description || null,
          price_per_kg: parseFloat(editForm.price_per_kg),
          turnaround_hours: parseInt(editForm.turnaround_hours),
        })
        .eq("id", editForm.id);
      if (error) throw error;
      toast.success("Service updated");
      setEditId(null);
      setEditForm(null);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update service");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(service: ServiceType) {
    const { error } = await supabase
      .from("service_types")
      .update({ is_active: !service.is_active })
      .eq("id", service.id);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(service.is_active ? "Service deactivated" : "Service activated");
      router.refresh();
    }
  }

  const inputClass =
    "w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition bg-white";

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {services.length} service{services.length !== 1 ? "s" : ""} configured
        </p>
        {canEdit && (
          <button
            onClick={() => { setShowAdd(true); setEditId(null); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Service
          </button>
        )}
      </div>

      {/* Add form */}
      {canEdit && showAdd && (
        <div className="px-5 py-4 bg-brand-50 border-b border-brand-100">
          <h3 className="text-sm font-semibold text-brand-800 mb-3">New Service Type</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Express Wash" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Price / kg (KES) *</label>
              <input type="number" min="1" step="0.01" value={form.price_per_kg} onChange={(e) => set("price_per_kg", e.target.value)} required placeholder="150" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Turnaround (hrs)</label>
              <input type="number" min="1" value={form.turnaround_hours} onChange={(e) => set("turnaround_hours", e.target.value)} className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
              <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional description…" className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowAdd(false); setForm(blankForm); }}
                className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg hover:bg-white transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg transition">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Saving…" : "Add Service"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services list */}
      <div className="divide-y divide-[var(--color-border)]">
        {services.map((svc) => (
          <div key={svc.id} className={`px-5 py-4 ${!svc.is_active ? "opacity-50" : ""}`}>
            {canEdit && editId === svc.id && editForm ? (
              /* Edit form inline */
              <form onSubmit={handleUpdate} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <input value={editForm.name} onChange={(e) => setEdit("name", e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <input type="number" min="1" step="0.01" value={editForm.price_per_kg} onChange={(e) => setEdit("price_per_kg", e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <input type="number" min="1" value={editForm.turnaround_hours} onChange={(e) => setEdit("turnaround_hours", e.target.value)} className={inputClass} />
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <input value={editForm.description} onChange={(e) => setEdit("description", e.target.value)} placeholder="Description…" className={inputClass} />
                </div>
                <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end">
                  <button type="button" onClick={() => { setEditId(null); setEditForm(null); }}
                    className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-lg transition">
                    <X className="w-4 h-4" />
                  </button>
                  <button type="submit" disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg transition">
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </form>
            ) : (
              /* Display row */
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{svc.name}</p>
                    {!svc.is_active && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{svc.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-600 tabular-nums">
                      {formatKES(svc.price_per_kg)}<span className="text-xs font-normal text-[var(--color-text-tertiary)]">/kg</span>
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-0.5 justify-end">
                      <Clock className="w-3 h-3" /> {svc.turnaround_hours}h
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditId(svc.id); setEditForm({ id: svc.id, name: svc.name, description: svc.description ?? "", price_per_kg: String(svc.price_per_kg), turnaround_hours: String(svc.turnaround_hours) }); setShowAdd(false); }}
                        className="p-1.5 text-[var(--color-text-tertiary)] hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggle(svc)}
                        className={`p-1.5 rounded-lg transition text-xs font-medium ${svc.is_active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                        title={svc.is_active ? "Deactivate" : "Activate"}
                      >
                        {svc.is_active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {services.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-[var(--color-text-tertiary)]">
            No service types yet. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}
