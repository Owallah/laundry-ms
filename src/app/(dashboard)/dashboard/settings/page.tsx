import { createClient } from "@/lib/supabase/server";
import { formatKES } from "@/lib/utils";
import ServiceTypesManager from "@/components/settings/ServiceTypesManager";
import ProfileSettings from "@/components/settings/ProfileSettings";
import type { ServiceType, Profile } from "@/types";
import { Settings, User, Package } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: services }, { data: profile }] = await Promise.all([
    supabase
      .from("service_types")
      .select("*")
      .order("price_per_kg"),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user!.id)
      .single(),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
          Manage your business configuration
        </p>
      </div>

      {/* Profile */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">My Profile</h2>
        </div>
        <ProfileSettings profile={profile as Profile} />
      </section>

      {/* Service types */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Service Types & Pricing</h2>
        </div>
        <ServiceTypesManager
          services={(services as ServiceType[]) ?? []}
          canEdit={["admin", "manager"].includes((profile as Profile)?.role ?? "")}
        />
      </section>

      {/* System info */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">System Information</h2>
        </div>
        <div className="card p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: "System", value: "Jamari LMS" },
            { label: "Version", value: "1.0.0" },
            { label: "Currency", value: "KES (Kenyan Shilling)" },
            { label: "Pricing Model", value: "Per kilogram (kg)" },
            { label: "Payment Methods", value: "M-Pesa, Cash" },
            { label: "Business Type", value: "Drop-off / Pickup" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide font-semibold mb-0.5">
                {label}
              </p>
              <p className="font-medium text-[var(--color-text-primary)]">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
