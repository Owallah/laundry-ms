import type {
  MpesaStkPushRequest,
  MpesaStkPushResponse,
} from "@/types";
import { formatMpesaPhone } from "@/lib/utils";

const MPESA_ENV = process.env.MPESA_ENV || "sandbox";
const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getMpesaToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  if (!res.ok) throw new Error("Failed to fetch M-Pesa token");
  const data = await res.json();
  return data.access_token;
}

function getMpesaPassword(timestamp: string): string {
  const str = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(str).toString("base64");
}

export async function initiateStkPush(
  input: MpesaStkPushRequest
): Promise<MpesaStkPushResponse> {
  const token = await getMpesaToken();
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);

  const phone = formatMpesaPhone(input.phone);
  const amount = Math.ceil(input.amount); // M-Pesa requires integer

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: getMpesaPassword(timestamp),
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: input.account_reference,
    TransactionDesc: `Payment for ${input.account_reference}`,
  };

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`M-Pesa STK push failed: ${err}`);
  }

  return res.json();
}

export async function queryStkStatus(checkoutRequestId: string) {
  const token = await getMpesaToken();
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: getMpesaPassword(timestamp),
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}
