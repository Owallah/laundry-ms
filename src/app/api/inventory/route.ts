import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name");

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { item_id, type, quantity, unit_cost, reference, notes } = body;

    if (!item_id || !type || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch current stock
    const { data: item, error: itemErr } = await supabase
      .from("inventory_items")
      .select("current_stock")
      .eq("id", item_id)
      .single();

    if (itemErr || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const signedQty =
      type === "usage" || type === "waste" ? -Math.abs(quantity) : Math.abs(quantity);
    const balanceAfter = Number(item.current_stock) + signedQty;

    if (balanceAfter < 0) {
      return NextResponse.json(
        { error: "Insufficient stock — balance would go negative" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("inventory_transactions")
      .insert({
        item_id,
        type,
        quantity: signedQty,
        balance_after: balanceAfter,
        unit_cost: unit_cost ?? null,
        total_cost: unit_cost ? Math.abs(quantity) * unit_cost : null,
        reference: reference ?? null,
        notes: notes ?? null,
        recorded_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
