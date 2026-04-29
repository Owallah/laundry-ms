import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CAN_EDIT_ROLES = ["admin", "manager"];

async function getCallerRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { user, role: profile?.role ?? null, supabase };
}

export async function GET() {
  try {
    const { user, supabase } = await getCallerRole();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("service_types")
      .select("*")
      .order("price_per_kg");

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, role, supabase } = await getCallerRole();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CAN_EDIT_ROLES.includes(role ?? ""))
      return NextResponse.json({ error: "Only admins and managers can edit pricing" }, { status: 403 });

    const body = await req.json();
    const { name, description, price_per_kg, turnaround_hours } = body;
    if (!name || !price_per_kg)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { data, error } = await supabase
      .from("service_types")
      .insert({ name, description: description || null, price_per_kg: parseFloat(price_per_kg), turnaround_hours: parseInt(turnaround_hours) || 24 })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, role, supabase } = await getCallerRole();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CAN_EDIT_ROLES.includes(role ?? ""))
      return NextResponse.json({ error: "Only admins and managers can edit pricing" }, { status: 403 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data, error } = await supabase
      .from("service_types").update(updates).eq("id", id).select().single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
