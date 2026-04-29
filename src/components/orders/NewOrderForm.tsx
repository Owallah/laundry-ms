"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateOrderTotal, formatKES } from "@/lib/utils";
import toast from "react-hot-toast";
import { Loader2, Plus, User, Scale, Calendar, Truck } from "lucide-react";
import type { ServiceType } from "@/types";
import Link from "next/link";

interface Customer { id: string; name: string; phone: string; }
interface StaffMember { id: string; full_name: string; role: string; }

interface Props {
  customers: Customer[];
  services: ServiceType[];
  staff: StaffMember[];
}

export default function NewOrderForm({ customers, services, staff }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTimeSlot, setPickupTimeSlot] = useState("");
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const selectedService = services.find((s) => s.id === serviceTypeId);
  const weight = parseFloat(weightKg) || 0;
  const disc = parseFloat(discount) || 0;
  const { subtotal, total } = calculateOrderTotal(
    weight,
    selectedService?.price_per_kg ?? 0,
    disc
  );

  // Set default pickup date to turnaround hours from now
  useEffect(() => {
    if (selectedService) {
      const d = new Date();
      d.setHours(d.getHours() + selectedService.turnaround_hours);
      setPickupDate(d.toISOString().split("T")[0]);
    }
  }, [selectedService]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return toast.error("Please select a customer");
    if (!serviceTypeId) return toast.error("Please select a service");
    if (!weight || weight <= 0) return toast.error("Please enter a valid weight");

    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          service_type_id: serviceTypeId,
          weight_kg: weight,
          price_per_kg: selectedService!.price_per_kg,
          subtotal,
          discount: disc,
          total,
          notes: notes || null,
          special_instructions: specialInstructions || null,
          pickup_date: pickupDate || null,
          pickup_time_slot: pickupTimeSlot || null,
          is_delivery: isDelivery,
          delivery_address: isDelivery ? deliveryAddress : null,
          assigned_to: assignedTo || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create order");

      const order = json.data;
      toast.success(`Order ${order.order_number} created!`);
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition bg-white";
  const labelClass =
    "block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Customer selection */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-brand-600" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Customer</h2>
        </div>

        <div className="relative">
          <label className={labelClass}>Select customer *</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-brand-800">{selectedCustomer.name}</p>
                <p className="text-xs text-brand-600">{selectedCustomer.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => { setCustomerId(""); setCustomerSearch(""); }}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                placeholder="Search by name or phone…"
                className={inputClass}
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                  {filteredCustomers.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-brand-50 text-left transition"
                      onClick={() => {
                        setCustomerId(c.id);
                        setCustomerSearch("");
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{c.name}</span>
                      <span className="text-xs text-[var(--color-text-tertiary)]">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="mt-2">
            <Link
              href="/dashboard/customers/new"
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> New customer
            </Link>
          </div>
        </div>
      </div>

      {/* Service & weight */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-brand-600" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Service & Weight</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Service type *</label>
            <select
              value={serviceTypeId}
              onChange={(e) => setServiceTypeId(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatKES(s.price_per_kg)}/kg
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Ready in ~{selectedService.turnaround_hours}h
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Weight (kg) *</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 3.5"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Discount (KES)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Assigned staff</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price summary */}
        {weight > 0 && selectedService && (
          <div className="mt-4 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>{weight} kg × {formatKES(selectedService.price_per_kg)}</span>
                <span className="tabular-nums">{formatKES(subtotal)}</span>
              </div>
              {disc > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatKES(disc)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[var(--color-text-primary)] pt-1.5 border-t border-[var(--color-border)] text-base">
                <span>Total</span>
                <span className="tabular-nums text-brand-700">{formatKES(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pickup & delivery */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-brand-600" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Pickup & Delivery</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Expected pickup date</label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Time slot</label>
            <select
              value={pickupTimeSlot}
              onChange={(e) => setPickupTimeSlot(e.target.value)}
              className={inputClass}
            >
              <option value="">Any time</option>
              <option>08:00–12:00</option>
              <option>12:00–15:00</option>
              <option>15:00–18:00</option>
              <option>18:00–20:00</option>
            </select>
          </div>
        </div>

        {/* Delivery toggle */}
        <div className="flex items-center gap-3 mt-4 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <Truck className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Delivery order</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">We will deliver to customer&apos;s address</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDelivery}
            onClick={() => setIsDelivery(!isDelivery)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              isDelivery ? "bg-brand-500" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isDelivery ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {isDelivery && (
          <div className="mt-3">
            <label className={labelClass}>Delivery address</label>
            <input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Full delivery address"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="card p-5">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Notes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Internal notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Staff notes (not visible to customer)…"
              className={inputClass + " resize-none"}
            />
          </div>
          <div>
            <label className={labelClass}>Special instructions</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. Do not bleach, handle delicately…"
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end pb-6">
        <Link
          href="/dashboard/orders"
          className="px-5 py-2.5 text-sm font-medium border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating…" : "Create Order"}
        </button>
      </div>
    </form>
  );
}
