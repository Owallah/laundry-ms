import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MpesaCallbackData } from "@/types";

// Called by Safaricom after payment completes or fails
export async function POST(req: NextRequest) {
  try {
    const body: MpesaCallbackData = await req.json();
    const callback = body.Body.stkCallback;
    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback;

    // Use service role for callback (no user session)
    const supabase = await createClient();

    if (ResultCode === 0 && CallbackMetadata) {
      // Payment successful
      const items = CallbackMetadata.Item;
      const get = (name: string) =>
        items.find((i) => i.Name === name)?.Value ?? null;

      const mpesaReceiptNumber = String(get("MpesaReceiptNumber") ?? "");
      const amount = Number(get("Amount") ?? 0);
      const transactionId = String(get("TransactionId") ?? "");

      // Find the pending payment
      const { data: payment } = await supabase
        .from("payments")
        .select("id, order_id, customer_id, amount")
        .eq("mpesa_checkout_request_id", CheckoutRequestID)
        .single();

      if (!payment) {
        console.error("Payment not found for checkout:", CheckoutRequestID);
        return NextResponse.json({ ok: true });
      }

      // Update payment to paid
      await supabase.from("payments").update({
        status: "paid",
        mpesa_receipt_number: mpesaReceiptNumber,
        mpesa_transaction_id: transactionId,
        amount,
      }).eq("id", payment.id);

      // Update order amount_paid and payment_status
      const { data: order } = await supabase
        .from("orders")
        .select("total, amount_paid")
        .eq("id", payment.order_id)
        .single();

      if (order) {
        const newAmountPaid = Number(order.amount_paid) + amount;
        const total = Number(order.total);
        const paymentStatus =
          newAmountPaid >= total ? "paid" : newAmountPaid > 0 ? "partial" : "pending";

        await supabase.from("orders").update({
          amount_paid: newAmountPaid,
          payment_status: paymentStatus,
        }).eq("id", payment.order_id);
      }
    } else {
      // Payment failed or cancelled — mark as pending (not paid)
      await supabase.from("payments").update({ status: "pending" })
        .eq("mpesa_checkout_request_id", CheckoutRequestID);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
