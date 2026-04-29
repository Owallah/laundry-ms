import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime, getInitials } from "@/lib/utils";
import StaffShiftManager from "@/components/staff/StaffShiftManager";
import type { Profile, Shift } from "@/types";
import { UserPlus } from "lucide-react";
import AddStaffModal from "@/components/staff/AddStaffModal";

export default async function StaffPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [{ data: staff }, { data: shifts }, { data: todayShifts }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("full_name"),
      supabase
        .from("shifts")
        .select(`*, staff:profiles(full_name, role)`)
        .gte("shift_date", weekStart)
        .order("shift_date", { ascending: false })
        .order("start_time"),
      supabase
        .from("shifts")
        .select(`*, staff:profiles(full_name, role, avatar_url)`)
        .eq("shift_date", today)
        .order("start_time"),
    ]);

  const SHIFT_STATUS_COLORS: Record<string, string> = {
    scheduled: "bg-blue-50 text-blue-700",
    active: "bg-emerald-50 text-emerald-700",
    completed: "bg-slate-50 text-slate-600",
    absent: "bg-red-50 text-red-700",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Staff & Shifts</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
            {staff?.length ?? 0} staff members
          </p>
        </div>
        <AddStaffModal />
      </div>

      {/* Today's shifts */}
      <div className="card p-5">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">
          Today — {formatDate(today)}
        </h2>
        {todayShifts && todayShifts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(todayShifts as Shift[]).map((shift) => {
              const s = shift.staff as { full_name: string; role: string } | undefined;
              return (
                <div
                  key={shift.id}
                  className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
                    {s ? getInitials(s.full_name) : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {s?.full_name}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${SHIFT_STATUS_COLORS[shift.status]}`}>
                    {shift.status}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-tertiary)]">
            No shifts scheduled for today
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Staff list */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Team</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {(staff as Profile[])?.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-300 to-brand-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {getInitials(member.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {member.full_name}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] capitalize">
                    {member.role}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${member.is_active ? "bg-emerald-400" : "bg-slate-300"}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Shift schedule */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text-primary)]">
              Shifts (Last 7 days)
            </h2>
            <StaffShiftManager staff={(staff as Profile[]) ?? []} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  {["Staff", "Date", "Hours", "Clock In", "Clock Out", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts && shifts.length > 0 ? (
                  (shifts as Shift[]).map((shift) => {
                    const s = shift.staff as { full_name: string } | undefined;
                    return (
                      <tr key={shift.id} className="table-row-hover border-b border-[var(--color-border)] last:border-0">
                        <td className="px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] whitespace-nowrap">
                          {s?.full_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                          {formatDate(shift.shift_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                          {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                          {shift.clock_in ? formatTime(shift.clock_in) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                          {shift.clock_out ? formatTime(shift.clock_out) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-md ${SHIFT_STATUS_COLORS[shift.status]}`}>
                            {shift.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--color-text-tertiary)]">
                      No shifts this week
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
