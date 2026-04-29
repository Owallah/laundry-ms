import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateStkPush } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { order_id, customer_id, amount, phone, account_reference } = body;

    if (!order_id || !customer_id || !amount || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Initiate STK push
    const mpesaRes = await initiateStkPush({
      phone,
      amount: parseFloat(amount),
      order_id,
      account_reference,
    });

    if (mpesaRes.ResponseCode !== "0") {
      return NextResponse.json(
        { error: mpesaRes.ResponseDescription },
        { status: 400 }
      );
    }

    // Save pending payment record
    const { error: insertErr } = await supabase.from("payments").insert({
      order_id,
      customer_id,
      amount: parseFloat(amount),
      method: "mpesa",
      status: "pending",
      mpesa_phone: phone,
      mpesa_checkout_request_id: mpesaRes.CheckoutRequestID,
      received_by: user.id,
    });

    if (insertErr) throw insertErr;

    return NextResponse.json({
      message: "STK push sent",
      checkout_request_id: mpesaRes.CheckoutRequestID,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
