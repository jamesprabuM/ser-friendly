import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({ orderId: z.string().uuid() });

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured");

    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, total_cents, status, razorpay_order_id")
      .eq("id", data.orderId)
      .single();
    if (error || !order) throw new Error("Order not found");
    if (order.status === "paid") throw new Error("Order already paid");

    // Reuse existing razorpay order if present
    if (order.razorpay_order_id) {
      return {
        key_id: keyId,
        razorpay_order_id: order.razorpay_order_id,
        amount: order.total_cents,
        currency: "INR",
      };
    }

    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: order.total_cents, // paise
        currency: "INR",
        receipt: order.id,
        notes: { order_id: order.id },
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Razorpay error: ${resp.status} ${text.slice(0, 200)}`);
    }
    const rzp = (await resp.json()) as { id: string; amount: number; currency: string };

    await context.supabase
      .from("orders")
      .update({ razorpay_order_id: rzp.id })
      .eq("id", order.id);

    return {
      key_id: keyId,
      razorpay_order_id: rzp.id,
      amount: rzp.amount,
      currency: rzp.currency,
    };
  });

const verifySchema = z.object({
  orderId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay is not configured");

    const body = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
    const expected = createHmac("sha256", keySecret).update(body).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(data.razorpay_signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Invalid payment signature");
    }

    const { error } = await context.supabase
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: data.razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", data.orderId)
      .eq("razorpay_order_id", data.razorpay_order_id);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
