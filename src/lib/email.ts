import nodemailer from "nodemailer";

function getDestinationEmail() {
  return process.env.NOTIFY_TO_EMAIL || "casamentonadjilla@gmail.com";
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendNotificationEmail(subject: string, text: string, html?: string) {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: "SMTP não configurado" };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@localhost",
    to: getDestinationEmail(),
    subject,
    text,
    ...(html ? { html } : {})
  });

  return { sent: true as const };
}
