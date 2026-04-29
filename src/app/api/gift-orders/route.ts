import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, pool } from "@/lib/db";
import { buildGiftOrderEmailHtml } from "@/lib/email-templates";
import { sendNotificationEmail } from "@/lib/email";

const itemSchema = z.object({
  giftId: z.number().int().positive(),
  /** Cada presente da lista só pode ser levado uma vez (quantidade fixa 1). */
  quantity: z.literal(1)
});

function buildConfirmPaymentsUrl(): string | undefined {
  const token = process.env.ADMIN_GIFT_TOKEN?.trim();
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!token || !rawBase) return undefined;
  const base = rawBase.replace(/\/$/, "");
  return `${base}/admin/presentes?token=${encodeURIComponent(token)}`;
}

const orderSchema = z
  .object({
    buyerName: z.string().min(2),
    buyerEmail: z.string().email().optional().or(z.literal("")),
    message: z.string().max(500).optional().or(z.literal("")),
    items: z.array(itemSchema).min(1)
  })
  .superRefine((data, ctx) => {
    const ids = data.items.map((i) => i.giftId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Presente duplicado no pedido"
      });
    }
  });

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const data = orderSchema.parse(body);

    const giftIds = data.items.map((item) => item.giftId);

    const client = await pool.connect();
    let orderId = 0;
    let totalCents = 0;
    let orderItems: Array<{ giftId: number; quantity: number; unitCents: number }> = [];
    let giftById = new Map<
      number,
      { id: number; name: string; priceCents: number }
    >();

    try {
      await client.query("BEGIN");

      const locked = await client.query(
        `
        SELECT id, name, price_cents
        FROM gift
        WHERE id = ANY($1::int[]) AND active = TRUE
        FOR UPDATE
        `,
        [giftIds]
      );

      if (locked.rows.length !== data.items.length) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            ok: false,
            error:
              "Um ou mais presentes não estão mais disponíveis. Volte à lista de presentes e atualize o carrinho."
          },
          { status: 409 }
        );
      }

      giftById = new Map(
        locked.rows.map((gift) => [
          Number(gift.id),
          {
            id: Number(gift.id),
            name: String(gift.name),
            priceCents: Number(gift.price_cents)
          }
        ])
      );

      orderItems = data.items.map((item) => {
        const gift = giftById.get(item.giftId);
        if (!gift) {
          throw new Error(`Presente inconsistente: ${item.giftId}`);
        }
        return {
          giftId: gift.id,
          quantity: 1,
          unitCents: gift.priceCents
        };
      });

      totalCents = orderItems.reduce((acc, item) => acc + item.quantity * item.unitCents, 0);

      const orderResult = await client.query(
        `
        INSERT INTO gift_order (buyer_name, buyer_email, message, total_cents, status, payment_status)
        VALUES ($1, $2, $3, $4, 'pendente', 'awaiting_couple')
        RETURNING id
        `,
        [data.buyerName, data.buyerEmail || null, data.message || null, totalCents]
      );
      orderId = Number(orderResult.rows[0].id);

      for (const item of orderItems) {
        await client.query(
          `
          INSERT INTO gift_order_item (order_id, gift_id, quantity, unit_cents)
          VALUES ($1, $2, $3, $4)
          `,
          [orderId, item.giftId, item.quantity, item.unitCents]
        );
      }

      await client.query(
        `
        UPDATE gift SET active = FALSE WHERE id = ANY($1::int[])
        `,
        [giftIds]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const giftItems = orderItems.map((item) => {
      const gift = giftById.get(item.giftId);
      const lineCents = item.quantity * item.unitCents;
      return {
        name: gift?.name ?? "Presente",
        quantity: item.quantity,
        unitCents: item.unitCents,
        lineCents
      };
    });

    const { html, text } = buildGiftOrderEmailHtml({
      buyerName: data.buyerName,
      buyerEmail: data.buyerEmail || "",
      message: data.message || "",
      items: giftItems,
      totalCents,
      orderId,
      confirmPaymentsUrl: buildConfirmPaymentsUrl()
    });

    const emailResult = await sendNotificationEmail(
      "Nova compra na lista de presentes — Jônatas & Nadjilla",
      text,
      html
    );

    return NextResponse.json(
      {
        ok: true,
        orderId,
        totalCents,
        emailSent: emailResult.sent
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falha ao finalizar compra de presente",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
