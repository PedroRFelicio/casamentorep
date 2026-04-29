"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CartItem = {
  giftId: number;
  name: string;
  quantity: number;
  unitCents: number;
};

const bbPayUrl =
  typeof process.env.NEXT_PUBLIC_BB_PAY_URL === "string"
    ? process.env.NEXT_PUBLIC_BB_PAY_URL.trim()
    : "";

export default function CarrinhoPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("gift-cart");
    if (!raw) return;
    const parsed = JSON.parse(raw) as CartItem[];
    const dedup = new Map<number, CartItem>();
    for (const item of parsed) {
      dedup.set(item.giftId, { ...item, quantity: 1 });
    }
    const cleaned = Array.from(dedup.values());
    if (JSON.stringify(cleaned) !== JSON.stringify(parsed)) {
      localStorage.setItem("gift-cart", JSON.stringify(cleaned));
    }
    setItems(cleaned);
  }, []);

  const totalCents = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity * item.unitCents, 0),
    [items]
  );

  function removeItem(giftId: number) {
    setItems((prev) => {
      const next = prev.filter((item) => item.giftId !== giftId);
      if (next.length === 0) {
        localStorage.removeItem("gift-cart");
      } else {
        localStorage.setItem("gift-cart", JSON.stringify(next));
      }
      return next;
    });
    setFeedback("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSending(true);
    setFeedback("");

    const formData = new FormData(form);
    const payload = {
      buyerName: String(formData.get("buyerName") || ""),
      buyerEmail: String(formData.get("buyerEmail") || ""),
      message: String(formData.get("message") || ""),
      items: items.map((item) => ({ giftId: item.giftId, quantity: item.quantity }))
    };

    const response = await fetch("/api/gift-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let result: { ok?: boolean; error?: string } = {};
    try {
      result = (await response.json()) as { ok?: boolean; error?: string };
    } catch {
      /* ignore */
    }

    if (response.ok) {
      localStorage.removeItem("gift-cart");
      setItems([]);
      form.reset();
      if (bbPayUrl) {
        setFeedback("Pedido registrado! Abrindo o pagamento no Banco do Brasil...");
        setSending(false);
        window.location.assign(bbPayUrl);
        return;
      }
      setFeedback("Compra registrada! Obrigado pelo carinho.");
    } else if (response.status === 409 && result.error) {
      setFeedback(result.error);
    } else {
      setFeedback(result.error || "Não foi possível finalizar agora.");
    }
    setSending(false);
  }

  return (
    <main className="single-page">
      <section className="section-block section-text">
        <div className="card">
          <h2>Carrinho de presentes</h2>
          {items.length === 0 ? <p>Seu carrinho está vazio.</p> : null}
          {items.map((item) => (
            <div key={item.giftId} className="cart-item">
              <div className="cart-item-info">
                <strong>{item.name}</strong>
                <p>R$ {(item.unitCents / 100).toFixed(2)}</p>
              </div>
              <div className="cart-item-actions">
                <span className="cart-qty-label">1 unidade</span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeItem(item.giftId)}
                  aria-label={`Remover ${item.name} do carrinho`}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          <p>
            <strong>Total: R$ {(totalCents / 100).toFixed(2)}</strong>
          </p>

          <form onSubmit={handleSubmit} className="grid">
            <div>
              <label htmlFor="buyerName">Nome de quem está enviando</label>
              <input id="buyerName" name="buyerName" required />
            </div>
            <div>
              <label htmlFor="buyerEmail">E-mail (opcional)</label>
              <input id="buyerEmail" name="buyerEmail" type="email" />
            </div>
            <div>
              <label htmlFor="message">Recado</label>
              <textarea id="message" name="message" rows={4} />
            </div>
            <button className="btn" type="submit" disabled={sending || items.length === 0}>
              {sending ? "Finalizando..." : "Finalizar compra"}
            </button>
            {feedback ? <p>{feedback}</p> : null}
          </form>
          {!bbPayUrl ? (
            <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
              Configure <code style={{ fontSize: 13 }}>NEXT_PUBLIC_BB_PAY_URL</code> no arquivo{" "}
              <code style={{ fontSize: 13 }}>.env</code> para redirecionar ao BB Pay após o pedido.
            </p>
          ) : (
            <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
              Ao finalizar, você será encaminhado ao pagamento seguro do Banco do Brasil (BB Pay).
            </p>
          )}
          <p style={{ marginTop: 16 }}>
            <Link href="/#presentes" className="btn btn-secondary">
              Adicionar mais presentes
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
