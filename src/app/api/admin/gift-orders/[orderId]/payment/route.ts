import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, pool } from "@/lib/db";
import { getAdminToken, isAuthorizedAdmin } from "@/lib/admin-token";

const bodySchema = z.object({
  action: z.enum(["paid", "not_received"])
});

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const token = getAdminToken(request);
  if (!isAuthorizedAdmin(token)) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }

  const { orderId: orderIdParam } = await context.params;
  const orderId = Number(orderIdParam);
  if (!Number.isFinite(orderId) || orderId < 1) {
    return NextResponse.json({ ok: false, error: "Pedido inválido" }, { status: 400 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
  }

  await ensureSchema();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const cur = await client.query(
      `SELECT payment_status FROM gift_order WHERE id = $1 FOR UPDATE`,
      [orderId]
    );

    if (cur.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok: false, error: "Pedido não encontrado" }, { status: 404 });
    }

    if (String(cur.rows[0].payment_status) !== "awaiting_couple") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          ok: false,
          error: "Este pedido já foi confirmado ou os presentes foram devolvidos à lista."
        },
        { status: 409 }
      );
    }

    if (body.action === "paid") {
      await client.query(`UPDATE gift_order SET payment_status = 'paid' WHERE id = $1`, [orderId]);
    } else {
      await client.query(`UPDATE gift_order SET payment_status = 'not_received' WHERE id = $1`, [
        orderId
      ]);
      await client.query(
        `
        UPDATE gift SET active = TRUE
        WHERE id IN (SELECT gift_id FROM gift_order_item WHERE order_id = $1)
        `,
        [orderId]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
