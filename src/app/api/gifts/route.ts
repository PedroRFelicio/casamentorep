import { NextResponse } from "next/server";
import { ensureSchema, pool } from "@/lib/db";

const defaultGifts = [
  {
    name: "Jantar especial",
    description: "Contribua com um jantar romântico para nossa lua de mel.",
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80",
    priceCents: 15000
  },
  {
    name: "Passeio na viagem",
    description: "Ajude com um passeio inesquecível durante a viagem.",
    imageUrl:
      "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1000&q=80",
    priceCents: 20000
  },
  {
    name: "Cota para o novo lar",
    description: "Contribuição para os primeiros itens da casa nova.",
    imageUrl:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80",
    priceCents: 10000
  }
];

export async function GET() {
  await ensureSchema();

  const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM gift");
  const count = Number(countResult.rows[0].count || 0);

  if (count === 0) {
    for (const gift of defaultGifts) {
      await pool.query(
        "INSERT INTO gift (name, description, image_url, price_cents, active) VALUES ($1, $2, $3, $4, TRUE)",
        [gift.name, gift.description, gift.imageUrl, gift.priceCents]
      );
    }
  }

  const giftsResult = await pool.query(
    `
    SELECT id, name, description, image_url AS "imageUrl", price_cents AS "priceCents"
    FROM gift
    WHERE active = TRUE
    ORDER BY created_at ASC
    `
  );

  return NextResponse.json({ ok: true, gifts: giftsResult.rows });
}
