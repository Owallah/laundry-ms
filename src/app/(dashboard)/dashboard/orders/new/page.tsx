import { createClient } from "@/lib/supabase/server";
import NewOrderForm from "@/components/orders/NewOrderForm";

export default async function NewOrderPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: services }, { data: staff }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, name, phone")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("service_types")
        .select("*")
        .eq("is_active", true)
        .order("price_per_kg"),
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("is_active", true)
        .order("full_name"),
    ]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          Create New Order
        </h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
          Fill in the details below to register a new laundry order
        </p>
      </div>
      <NewOrderForm
        customers={customers ?? []}
        services={services ?? []}
        staff={staff ?? []}
      />
    </div>
  );
}
