"use client";

import { FormEvent, useState } from "react";

export default function RecadosPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);
    setMessage("");

    const formData = new FormData(form);
    const payload = {
      authorName: String(formData.get("authorName") || ""),
      email: String(formData.get("email") || ""),
      content: String(formData.get("content") || "")
    };

    const response = await fetch("/api/recados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      form.reset();
      setMessage("Recado enviado com sucesso. Ele sera exibido apos aprovacao.");
    } else {
      setMessage("Nao foi possivel enviar o recado.");
    }

    setLoading(false);
  }

  return (
    <main className="container">
      <section className="card">
        <h1>Deixe seu recado</h1>
        <form onSubmit={handleSubmit} className="grid" style={{ marginTop: 16 }}>
          <div>
            <label htmlFor="authorName">Seu nome</label>
            <input id="authorName" name="authorName" required />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" />
          </div>
          <div>
            <label htmlFor="content">Recado</label>
            <textarea id="content" name="content" rows={4} required />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar recado"}
          </button>
          {message ? <p>{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
