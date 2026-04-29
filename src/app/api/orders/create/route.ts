import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      customer_id,
      service_type_id,
      weight_kg,
      price_per_kg,
      subtotal,
      discount,
      total,
      notes,
      special_instructions,
      pickup_date,
      pickup_time_slot,
      is_delivery,
      delivery_address,
      assigned_to,
    } = body;

    // Validate required fields
    if (!customer_id || !service_type_id || !weight_kg || !total) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use admin client (service role) to bypass any RLS issues
    // and call the generate_order_number() function reliably
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check the user has a profile row (foreign key guard)
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    const receivedBy = profile ? user.id : null;

    // Generate order number via RPC (server-side, no RLS)
    const { data: orderNumData, error: rpcError } = await admin.rpc(
      "generate_order_number"
    );

    if (rpcError) {
      console.error("generate_order_number RPC error:", rpcError);
      // Fallback: generate in JS if RPC fails
    }

    // If RPC failed or returned null, generate a timestamp-based fallback
    const orderNumber =
      orderNumData ||
      `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Insert the order with the pre-generated order number
    const { data: order, error: insertError } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id,
        service_type_id,
        weight_kg: parseFloat(weight_kg),
        price_per_kg: parseFloat(price_per_kg),
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount ?? 0),
        total: parseFloat(total),
        notes: notes || null,
        special_instructions: special_instructions || null,
        pickup_date: pickup_date || null,
        pickup_time_slot: pickup_time_slot || null,
        is_delivery: is_delivery ?? false,
        delivery_address: delivery_address || null,
        assigned_to: assigned_to || null,
        received_by: receivedBy,
        status: "received",
        payment_status: "pending",
        amount_paid: 0,
      })
      .select(
        `*, customer:customers(name, phone), service_type:service_types(name)`
      )
      .single();

    if (insertError) {
      console.error("Order insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message, details: insertError.details },
        { status: 409 }
      );
    }

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (err: unknown) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
