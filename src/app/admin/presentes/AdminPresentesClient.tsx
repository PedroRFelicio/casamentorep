"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

type OrderItem = {
  giftId: number;
  giftName: string;
  quantity: number;
  unitCents: number;
};

type Order = {
  id: number;
  buyerName: string;
  buyerEmail: string | null;
  message: string | null;
  totalCents: number;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};

export function AdminPresentesClient() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";
  const [tokenInput, setTokenInput] = useState("");
  const token = tokenFromUrl || tokenInput;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/gift-orders?token=${encodeURIComponent(token)}`);
      const data = (await res.json()) as { ok?: boolean; orders?: Order[]; error?: string };
      if (!res.ok) {
        setError(data.error || "Não foi possível carregar.");
        setOrders([]);
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      setError("Erro de rede.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tokenFromUrl) {
      setTokenInput(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function act(orderId: number, action: "paid" | "not_received") {
    setActingId(orderId);
    setError("");
    try {
      const res = await fetch(`/api/admin/gift-orders/${orderId}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({ action })
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Não foi possível atualizar.");
        return;
      }
      await load();
    } catch {
      setError("Erro de rede.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <main className="single-page">
      <section className="section-block section-text">
        <div className="card admin-card">
          <h2>Painel — presentes</h2>
          <p style={{ marginTop: 8 }}>
            Confira no BB Pay / extrato se o valor entrou. Depois marque abaixo para cada pedido pendente.
          </p>

          {!tokenFromUrl ? (
            <div className="grid" style={{ marginTop: 16 }}>
              <div>
                <label htmlFor="admin-token">Código de acesso (mesmo do link do e-mail)</label>
                <input
                  id="admin-token"
                  type="password"
                  autoComplete="off"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Cole o token da URL ?token=..."
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="admin-error" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? <p>Carregando...</p> : null}

          {!loading && token && orders.length === 0 ? (
            <p style={{ marginTop: 16 }}>Nenhum pedido aguardando confirmação de pagamento.</p>
          ) : null}

          <ul className="admin-order-list">
            {orders.map((order) => (
              <li key={order.id} className="admin-order">
                <div className="admin-order-head">
                  <strong>Pedido #{order.id}</strong>
                  <span className="admin-order-total">
                    Total: R$ {(order.totalCents / 100).toFixed(2)}
                  </span>
                </div>
                <p>
                  <strong>Quem enviou:</strong> {order.buyerName}
                </p>
                {order.buyerEmail ? (
                  <p>
                    <strong>E-mail:</strong> {order.buyerEmail}
                  </p>
                ) : null}
                {order.message ? (
                  <p className="admin-recado">
                    <strong>Recado:</strong> {order.message}
                  </p>
                ) : null}
                <ul className="admin-items">
                  {order.items.map((it) => (
                    <li key={it.giftId}>
                      {it.giftName} — R$ {(it.unitCents / 100).toFixed(2)}
                    </li>
                  ))}
                </ul>
                <div className="admin-actions">
                  <button
                    type="button"
                    className="btn"
                    disabled={actingId !== null}
                    onClick={() => act(order.id, "paid")}
                  >
                    {actingId === order.id ? "Salvando..." : "Pagamento recebido"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={actingId !== null}
                    onClick={() => act(order.id, "not_received")}
                  >
                    {actingId === order.id
                      ? "Salvando..."
                      : "Não recebi / convidado não pagou — devolver presentes"}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p style={{ marginTop: 24 }}>
            <Link href="/#presentes" className="btn btn-secondary">
              Voltar ao site
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export function AdminPresentesPageShell() {
  return (
    <Suspense
      fallback={
        <main className="single-page">
          <p className="container">Carregando...</p>
        </main>
      }
    >
      <AdminPresentesClient />
    </Suspense>
  );
}
