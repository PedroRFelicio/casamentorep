"use client";

import { FormEvent, useState } from "react";

export default function RsvpPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);
    setMessage("");

    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      adults: Number(formData.get("adults") || 1),
      children: Number(formData.get("children") || 0),
      willAttend: formData.get("willAttend") === "sim",
      notes: String(formData.get("notes") || "")
    };

    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      form.reset();
      setMessage("Confirmacao enviada com sucesso.");
    } else {
      setMessage("Nao foi possivel enviar agora.");
    }

    setLoading(false);
  }

  return (
    <main className="container">
      <section className="card">
        <h1>Confirme sua presenca</h1>
        <form onSubmit={handleSubmit} className="grid" style={{ marginTop: 16 }}>
          <div>
            <label htmlFor="fullName">Nome completo</label>
            <input id="fullName" name="fullName" required />
          </div>
          <div className="grid grid-2">
            <div>
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" />
            </div>
            <div>
              <label htmlFor="phone">Telefone</label>
              <input id="phone" name="phone" />
            </div>
          </div>
          <div className="grid grid-2">
            <div>
              <label htmlFor="adults">Quantidade de adultos</label>
              <input id="adults" name="adults" type="number" defaultValue={1} min={1} />
            </div>
            <div>
              <label htmlFor="children">Quantidade de criancas</label>
              <input id="children" name="children" type="number" defaultValue={0} min={0} />
            </div>
          </div>
          <div>
            <label htmlFor="willAttend">Voce vai ao evento?</label>
            <select id="willAttend" name="willAttend" defaultValue="sim">
              <option value="sim">Sim</option>
              <option value="nao">Nao</option>
            </select>
          </div>
          <div>
            <label htmlFor="notes">Observacoes</label>
            <textarea id="notes" name="notes" rows={4} />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar confirmacao"}
          </button>
          {message ? <p>{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
