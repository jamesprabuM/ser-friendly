import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export interface AdminOverview {
  totals: {
    revenue_cents: number;
    orders: number;
    paid_orders: number;
    pending_orders: number;
    products: number;
    subscribers: number;
    users: number;
  };
  recent_orders: Array<{
    id: string;
    created_at: string;
    status: string;
    total_cents: number;
    ship_name: string;
    ship_email: string;
    ship_city: string;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    paid_at: string | null;
    items: Array<{ product_name: string; quantity: number; unit_price_cents: number }>;
  }>;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    price_cents: number;
    stock: number;
    featured: boolean;
    published: boolean;
  }>;
  subscribers: Array<{ id: string; email: string; created_at: string }>;
  users: Array<{ id: string; email: string | null; created_at: string; last_sign_in_at: string | null; is_admin: boolean }>;
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [ordersRes, productsRes, subsRes, rolesRes, usersRes] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select(
          "id, created_at, status, total_cents, ship_name, ship_email, ship_city, razorpay_order_id, razorpay_payment_id, paid_at, order_items(product_name, quantity, unit_price_cents)"
        )
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("products")
        .select("id, name, slug, category, price_cents, stock, featured, published")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("newsletter_subscribers")
        .select("id, email, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (productsRes.error) throw new Error(productsRes.error.message);
    if (subsRes.error) throw new Error(subsRes.error.message);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (usersRes.error) throw new Error(usersRes.error.message);

    const orders = ordersRes.data ?? [];
    const products = productsRes.data ?? [];
    const subscribers = subsRes.data ?? [];
    const adminIds = new Set(
      (rolesRes.data ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id)
    );
    const users = (usersRes.data?.users ?? []).map((u: any) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      is_admin: adminIds.has(u.id),
    }));

    const paid = orders.filter((o: any) => o.status === "paid" || o.paid_at);
    const pending = orders.filter((o: any) => !(o.status === "paid" || o.paid_at) && o.status !== "cancelled" && o.status !== "failed");
    const revenue = paid.reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0);

    return {
      totals: {
        revenue_cents: revenue,
        orders: orders.length,
        paid_orders: paid.length,
        pending_orders: pending.length,
        products: products.length,
        subscribers: subscribers.length,
        users: users.length,
      },
      recent_orders: orders.slice(0, 50).map((o: any) => ({
        id: o.id,
        created_at: o.created_at,
        status: o.status,
        total_cents: o.total_cents,
        ship_name: o.ship_name,
        ship_email: o.ship_email,
        ship_city: o.ship_city,
        razorpay_order_id: o.razorpay_order_id,
        razorpay_payment_id: o.razorpay_payment_id,
        paid_at: o.paid_at,
        items: o.order_items ?? [],
      })),
      products,
      subscribers,
      users,
    };
  });
