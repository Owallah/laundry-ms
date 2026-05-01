"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, LogIn, LogOut, UserX } from "lucide-react";
import type { Shift } from "@/types";

export default function ClockInOut({ shift }: { shift: Shift }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function doAction(action: "clock_in" | "clock_out" | "mark_absent") {
    setLoading(action);
    try {
      const res = await fetch(`/api/staff/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      const messages = {
        clock_in:    "Clocked in successfully",
        clock_out:   "Clocked out successfully",
        mark_absent: "Marked as absent",
      };
      toast.success(messages[action]);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  const already_in  = !!shift.clock_in;
  const already_out = !!shift.clock_out;
  const is_absent   = shift.status === "absent";
  const is_done     = already_out || is_absent;

  if (is_done) return null; // Nothing more to do

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {!already_in && !is_absent && (
        <button
          onClick={() => doAction("clock_in")}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition"
        >
          {loading === "clock_in" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
          Clock In
        </button>
      )}
      {already_in && !already_out && (
        <button
          onClick={() => doAction("clock_out")}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition"
        >
          {loading === "clock_out" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          Clock Out
        </button>
      )}
      {!already_in && (
        <button
          onClick={() => doAction("mark_absent")}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 text-xs font-semibold rounded-xl transition"
        >
          {loading === "mark_absent" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
          Absent
        </button>
      )}
    </div>
  );
}
