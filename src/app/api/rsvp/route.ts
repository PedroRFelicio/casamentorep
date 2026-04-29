import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, pool } from "@/lib/db";
import { buildRsvpEmailHtml } from "@/lib/email-templates";
import { sendNotificationEmail } from "@/lib/email";

const rsvpSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  adults: z.number().int().min(1).max(10),
  childrenUnderOrEqual6: z.number().int().min(0).max(10),
  childrenOver6: z.number().int().min(0).max(10),
  willAttend: z.boolean(),
  notes: z.string().max(500).optional().or(z.literal(""))
});

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const data = rsvpSchema.parse(body);

    const result = await pool.query(
      `
      INSERT INTO guest
        (full_name, email, phone, adults, children, children_under_or_equal_6, children_over_6, will_attend, notes)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
      `,
      [
        data.fullName,
        data.email || null,
        data.phone || null,
        data.adults,
        data.childrenUnderOrEqual6 + data.childrenOver6,
        data.childrenUnderOrEqual6,
        data.childrenOver6,
        data.willAttend,
        data.notes || null
      ]
    );

    const { html, text } = buildRsvpEmailHtml({
      fullName: data.fullName,
      email: data.email || "",
      phone: data.phone || "",
      adults: data.adults,
      childrenUnderOrEqual6: data.childrenUnderOrEqual6,
      childrenOver6: data.childrenOver6,
      willAttend: data.willAttend,
      notes: data.notes || ""
    });

    const emailResult = await sendNotificationEmail(
      "Nova confirmação de presença — Jônatas & Nadjilla",
      text,
      html
    );

    return NextResponse.json(
      { ok: true, id: result.rows[0].id as number, emailSent: emailResult.sent },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falha ao registrar RSVP",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
