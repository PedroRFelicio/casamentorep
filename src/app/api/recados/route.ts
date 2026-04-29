import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, pool } from "@/lib/db";

const messageSchema = z.object({
  authorName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  content: z.string().min(5).max(500)
});

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const data = messageSchema.parse(body);

    const created = await pool.query(
      `
      INSERT INTO message (author_name, email, content, approved)
      VALUES ($1, $2, $3, FALSE)
      RETURNING id
      `,
      [data.authorName, data.email || null, data.content]
    );

    return NextResponse.json({ ok: true, id: created.rows[0].id as number }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falha ao enviar recado",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
