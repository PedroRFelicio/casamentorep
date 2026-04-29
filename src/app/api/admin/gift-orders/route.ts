import { NextResponse } from "next/server";
import { ensureSchema, pool } from "@/lib/db";
import { getAdminToken, isAuthorizedAdmin } from "@/lib/admin-token";

export async function GET(request: Request) {
  const token = getAdminToken(request);
  if (!isAuthorizedAdmin(token)) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }

  await ensureSchema();

  const ordersResult = await pool.query(
    `
    SELECT id, buyer_name, buyer_email, message, total_cents, payment_status, created_at
    FROM gift_order
    WHERE payment_status = 'awaiting_couple'
    ORDER BY created_at DESC
    `
  );

  const orderIds = ordersResult.rows.map((r) => Number(r.id));
  if (orderIds.length === 0) {
    return NextResponse.json({ ok: true, orders: [] });
  }

  const itemsResult = await pool.query(
    `
    SELECT i.order_id, i.gift_id, i.quantity, i.unit_cents, g.name AS gift_name
    FROM gift_order_item i
    JOIN gift g ON g.id = i.gift_id
    WHERE i.order_id = ANY($1::int[])
    `,
    [orderIds]
  );

  const byOrder = new Map<number, typeof itemsResult.rows>();
  for (const row of itemsResult.rows) {
    const oid = Number(row.order_id);
    const list = byOrder.get(oid) ?? [];
    list.push(row);
    byOrder.set(oid, list);
  }

  const orders = ordersResult.rows.map((o) => ({
    id: Number(o.id),
    buyerName: String(o.buyer_name),
    buyerEmail: o.buyer_email ? String(o.buyer_email) : null,
    message: o.message ? String(o.message) : null,
    totalCents: Number(o.total_cents),
    paymentStatus: String(o.payment_status),
    createdAt: o.created_at,
    items: (byOrder.get(Number(o.id)) ?? []).map((it) => ({
      giftId: Number(it.gift_id),
      giftName: String(it.gift_name),
      quantity: Number(it.quantity),
      unitCents: Number(it.unit_cents)
    }))
  }));

  return NextResponse.json({ ok: true, orders });
}
