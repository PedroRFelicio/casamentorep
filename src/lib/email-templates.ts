/** Escape text for safe HTML email bodies */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const wrapEmail = (title: string, innerHtml: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#fffaf8;font-family:Georgia,'Times New Roman',serif;color:#2d2d2d;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fffaf8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #ecdde1;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:28px 24px 20px;text-align:center;background:linear-gradient(180deg,#f5f4f6 0%,#ffffff 100%);border-bottom:1px solid #ecdde1;">
              <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#6b6b6b;letter-spacing:0.02em;">Jônatas &amp; Nadjilla</p>
              <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8f8f8f;">Casamento — 04/07/2026</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 22px 28px;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 22px 22px;text-align:center;border-top:1px solid #ecdde1;background-color:#fffaf8;">
              <p style="margin:0;font-size:12px;color:#9a9a9a;">Mensagem automática do site do casamento</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

const row = (label: string, value: string) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0e6ea;font-size:15px;color:#555;">
      <strong style="color:#6e4651;display:block;margin-bottom:4px;font-weight:600;">${escapeHtml(label)}</strong>
      <span style="color:#2d2d2d;">${value}</span>
    </td>
  </tr>
`;

export function buildRsvpEmailHtml(data: {
  fullName: string;
  email: string;
  phone: string;
  adults: number;
  childrenUnderOrEqual6: number;
  childrenOver6: number;
  willAttend: boolean;
  notes: string;
}): { html: string; text: string } {
  const inner = `
    <p style="margin:0 0 20px;text-align:center;font-size:18px;color:#6e4651;font-weight:600;">Nova confirmação de presença</p>
    <p style="margin:0 0 18px;text-align:center;font-size:14px;color:#888;line-height:1.5;">Um convidado acabou de enviar a confirmação pelo site.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      ${row("Nome completo", escapeHtml(data.fullName))}
      ${row("E-mail", escapeHtml(data.email || "—"))}
      ${row("Telefone", escapeHtml(data.phone || "—"))}
      ${row("Adultos", String(data.adults))}
      ${row("Crianças até 6 anos", String(data.childrenUnderOrEqual6))}
      ${row("Crianças acima de 6 anos", String(data.childrenOver6))}
      ${row("Irá ao evento", data.willAttend ? "Sim" : "Não")}
      ${row("Observações", escapeHtml(data.notes || "—"))}
    </table>
  `;

  const text = [
    "Nova confirmação de presença",
    `Nome: ${data.fullName}`,
    `E-mail: ${data.email || "-"}`,
    `Telefone: ${data.phone || "-"}`,
    `Adultos: ${data.adults}`,
    `Crianças até 6: ${data.childrenUnderOrEqual6}`,
    `Crianças acima de 6: ${data.childrenOver6}`,
    `Irá ao evento: ${data.willAttend ? "Sim" : "Não"}`,
    `Observações: ${data.notes || "-"}`
  ].join("\n");

  return { html: wrapEmail("Confirmação de presença", inner), text };
}

export function buildGiftOrderEmailHtml(data: {
  buyerName: string;
  buyerEmail: string;
  message: string;
  items: Array<{ name: string; quantity: number; unitCents: number; lineCents: number }>;
  totalCents: number;
  orderId: number;
  /** Link para confirmar se o BB Pay entrou ou devolver presentes à lista */
  confirmPaymentsUrl?: string;
}): { html: string; text: string } {
  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #f0e6ea;font-size:14px;color:#2d2d2d;">${escapeHtml(item.name)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0e6ea;text-align:center;font-size:14px;">${item.quantity}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0e6ea;text-align:right;font-size:14px;">R$ ${(item.unitCents / 100).toFixed(2)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0e6ea;text-align:right;font-size:14px;font-weight:600;color:#6e4651;">R$ ${(item.lineCents / 100).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const recadoBlock =
    data.message.trim().length > 0
      ? `
    <div style="margin:20px 0 0;padding:16px;background-color:#fffaf8;border:1px solid #ecdde1;border-radius:12px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8b5e6b;font-weight:600;">Recado do convidado</p>
      <p style="margin:0;font-size:15px;line-height:1.55;color:#444;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
    </div>
  `
      : "";

  const inner = `
    <p style="margin:0 0 20px;text-align:center;font-size:18px;color:#6e4651;font-weight:600;">Nova compra na lista de presentes</p>
    <p style="margin:0 0 18px;text-align:center;font-size:14px;color:#888;line-height:1.5;">Pedido #${data.orderId}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
      ${row("Quem está enviando", escapeHtml(data.buyerName))}
      ${row("E-mail", escapeHtml(data.buyerEmail || "—"))}
    </table>
    <p style="margin:0 0 10px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#888;">Itens</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
      <tr style="background-color:#f5f4f6;">
        <th align="left" style="padding:10px 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Presente</th>
        <th style="padding:10px 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Qtd</th>
        <th align="right" style="padding:10px 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Unit.</th>
        <th align="right" style="padding:10px 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Subtotal</th>
      </tr>
      ${itemsRows}
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;">
      <tr>
        <td align="right" style="padding:14px 0 0;font-size:17px;font-weight:700;color:#6e4651;">
          Total: R$ ${(data.totalCents / 100).toFixed(2)}
        </td>
      </tr>
    </table>
    ${recadoBlock}
    ${
      data.confirmPaymentsUrl
        ? `
    <div style="margin:24px 0 0;padding:16px;background-color:#f8f4f6;border:1px solid #ecdde1;border-radius:12px;">
      <p style="margin:0 0 10px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#8b5e6b;font-weight:600;">Confirmar pagamento</p>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#555;">
        Quando conferir no extrato / BB Pay se o valor entrou, acesse o painel abaixo e marque se o pagamento foi recebido ou não.
        Se a pessoa só abriu o link e não pagou, marque &quot;não recebido&quot; para os presentes voltarem à lista.
      </p>
      <p style="margin:0;text-align:center;">
        <a href="${escapeHtml(data.confirmPaymentsUrl)}" style="display:inline-block;padding:12px 20px;background-color:#8b5e6b;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Abrir painel dos presentes</a>
      </p>
    </div>
    `
        : ""
    }
  `;

  const textLines = [
    `Nova compra na lista de presentes — Pedido #${data.orderId}`,
    `Nome: ${data.buyerName}`,
    `E-mail: ${data.buyerEmail || "-"}`,
    "",
    "Itens:",
    ...data.items.map(
      (i) =>
        `- ${i.name} | qtd ${i.quantity} | unit R$ ${(i.unitCents / 100).toFixed(2)} | subtotal R$ ${(i.lineCents / 100).toFixed(2)}`
    ),
    "",
    `Total: R$ ${(data.totalCents / 100).toFixed(2)}`,
    data.message.trim() ? `\nRecado:\n${data.message}` : "",
    data.confirmPaymentsUrl
      ? `\n\nConfirmar pagamento (painel):\n${data.confirmPaymentsUrl}`
      : ""
  ].join("\n");

  return { html: wrapEmail("Lista de presentes", inner), text: textLines };
}
