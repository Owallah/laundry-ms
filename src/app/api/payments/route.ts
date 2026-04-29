import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { order_id, customer_id, amount, method, notes } = body;

    if (!order_id || !customer_id || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch current order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("total, amount_paid, payment_status")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const parsedAmount = parseFloat(amount);
    const newAmountPaid = Number(order.amount_paid) + parsedAmount;
    const total = Number(order.total);

    let newPaymentStatus: string;
    if (newAmountPaid >= total) {
      newPaymentStatus = "paid";
    } else if (newAmountPaid > 0) {
      newPaymentStatus = "partial";
    } else {
      newPaymentStatus = "pending";
    }

    // Insert payment record
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .insert({
        order_id,
        customer_id,
        amount: parsedAmount,
        method,
        status: "paid",
        received_by: user.id,
        notes: notes || null,
      })
      .select()
      .single();

    if (payErr) throw payErr;

    // Update order
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        amount_paid: newAmountPaid,
        payment_status: newPaymentStatus,
      })
      .eq("id", order_id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ payment, payment_status: newPaymentStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = 25;
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from("payments")
      .select(`*, order:orders(order_number), customer:customers(name, phone)`, {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return NextResponse.json({ data, count, page, pageSize });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
