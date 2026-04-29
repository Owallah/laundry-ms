import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/staff/shifts/:id — clock in or out
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "clock_in" | "clock_out" | "mark_absent"

    const now = new Date().toISOString();
    let updatePayload: Record<string, unknown> = {};

    if (action === "clock_in") {
      updatePayload = { clock_in: now, status: "active" };
    } else if (action === "clock_out") {
      updatePayload = { clock_out: now, status: "completed" };
    } else if (action === "mark_absent") {
      updatePayload = { status: "absent" };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("shifts")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
