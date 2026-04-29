import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const checkoutId = req.nextUrl.searchParams.get("checkout_id");
    if (!checkoutId) {
      return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
    }

    const { data: payment } = await supabase
      .from("payments")
      .select("status, mpesa_receipt_number, amount")
      .eq("mpesa_checkout_request_id", checkoutId)
      .single();

    if (!payment) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      status: payment.status === "paid" ? "paid" : "pending",
      receipt: payment.mpesa_receipt_number,
      amount: payment.amount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
