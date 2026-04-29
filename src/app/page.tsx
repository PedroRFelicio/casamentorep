"use client";

import conviteImage from "../../WhatsApp Image 2026-04-28 at 18.18.26.jpeg";
import localImage from "../../imagem-do-whatsapp-de-2022-12-01-as-18-47-28-1_13_208354-166998813771220.jpeg";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Gift = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  priceCents: number;
};

export default function HomePage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftFeedback, setGiftFeedback] = useState("");

  useEffect(() => {
    async function loadGifts() {
      const response = await fetch("/api/gifts");
      if (!response.ok) return;
      const data = (await response.json()) as { gifts: Gift[] };
      setGifts(data.gifts);
    }
    loadGifts();
  }, []);

  function addToCart(gift: Gift) {
    const current = localStorage.getItem("gift-cart");
    const cart = current
      ? (JSON.parse(current) as Array<{ giftId: number; name: string; quantity: number; unitCents: number }>)
      : [];

    const existing = cart.find((item) => item.giftId === gift.id);
    if (existing) {
      setGiftFeedback("Este presente já está no seu carrinho.");
      router.push("/carrinho");
      return;
    }

    cart.push({ giftId: gift.id, name: gift.name, quantity: 1, unitCents: gift.priceCents });
    localStorage.setItem("gift-cart", JSON.stringify(cart));
    router.push("/carrinho");
  }

  async function handleRsvpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSending(true);
    setFeedback("");

    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      adults: Number(formData.get("adults") || 1),
      childrenUnderOrEqual6: Number(formData.get("childrenUnderOrEqual6") || 0),
      childrenOver6: Number(formData.get("childrenOver6") || 0),
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
      setFeedback("Confirmação enviada com sucesso!");
    } else {
      setFeedback("Não foi possível enviar agora. Tente novamente.");
    }

    setSending(false);
  }

  return (
    <main className="single-page">
      <section id="convite" className="section-block convite-block">
        <Image
          src={conviteImage}
          alt="Convite de casamento de Jônatas e Nadjilla"
          className="convite-image"
          priority
        />
      </section>

      <section id="sobre-noivos" className="section-block section-text">
        <div className="card">
          <h2>Sobre os noivos</h2>
          <p>
          Nossa história começou de forma inesperada, em um ônibus, com uma conversa sobre um anime. O que parecia casual virou conexão, encontros e momentos especiais.

        Após um tempo de oração e propósito, buscamos entender a vontade de Deus, e recebemos a confirmação através de um girassol, o sinal tão esperado por nós.

        Hoje celebramos, com amor e gratidão, o início do nosso para sempre, guiados por Deus.
          </p>
        </div>
      </section>

      <section id="local-hospedagem" className="section-block section-text">
        <div className="card">
          <h2>Local</h2>
          <Image
            src={localImage}
            alt="Espaço do casamento Recanto Fritz"
            className="local-image"
          />
          <p>
            <strong>Cerimônia e recepção:</strong> Sítio Recanto Fritz
            <br />
            Rua Sete, 489 - Chácara Novo Horizonte, Contagem - MG
          </p>
          <div className="map-wrap">
            <iframe
              title="Mapa do local do casamento"
              src="https://www.google.com/maps?q=Recanto+Fritz,+Contagem,+MG&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p style={{ marginTop: 12 }}>
            <a
              href="https://google.com/maps/place/Recanto+Fritz/data=!4m2!3m1!1s0x0:0xbb1c12d0bde3877f?sa=X&ved=1t:2428&ictx=111"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline" }}
            >
              Abrir rota no Google Maps
            </a>
          </p>
        </div>
      </section>

      <section id="dress-code" className="section-block section-text">
        <div className="card">
          <h2>Dress code</h2>
          <p>
            Traje sugerido: <strong>Esporte fino</strong>.
          </p>
          <p>
            Para harmonizar com a paleta do casamento, pedimos que, por gentileza, evitem tons de
            lilás, reservados aos padrinhos e madrinhas.
          </p>
        </div>
      </section>

      <section id="confirmacao" className="section-block section-text">
        <div className="card">
          <h2>Confirmação de presença</h2>
          <p>Preencha abaixo para confirmar sua presença:</p>
          <form onSubmit={handleRsvpSubmit} className="grid">
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
                <label htmlFor="adults">Adultos</label>
                <input id="adults" name="adults" type="number" defaultValue={1} min={1} />
              </div>
              <div>
                <label htmlFor="childrenUnderOrEqual6">Crianças até 6 anos</label>
                <input
                  id="childrenUnderOrEqual6"
                  name="childrenUnderOrEqual6"
                  type="number"
                  defaultValue={0}
                  min={0}
                />
              </div>
            </div>
            <div className="grid grid-2">
              <div>
                <label htmlFor="childrenOver6">Crianças acima de 6 anos</label>
                <input
                  id="childrenOver6"
                  name="childrenOver6"
                  type="number"
                  defaultValue={0}
                  min={0}
                />
              </div>
            </div>
            <div>
              <label htmlFor="willAttend">Você irá ao evento?</label>
              <select id="willAttend" name="willAttend" defaultValue="sim">
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
            <div>
              <label htmlFor="notes">Observações</label>
              <textarea id="notes" name="notes" rows={4} />
            </div>
            <button className="btn" type="submit" disabled={sending}>
              {sending ? "Enviando..." : "Enviar confirmação"}
            </button>
            {feedback ? <p>{feedback}</p> : null}
          </form>
        </div>
      </section>

      <section id="presentes" className="section-block section-text">
        <div className="card">
          <h2>Lista de presentes</h2>
          <p>Escolha um presente e adicione ao carrinho:</p>
          <div className="gifts-grid">
            {gifts.map((gift) => (
              <article key={gift.id} className="gift-card">
                <Image
                  src={gift.imageUrl}
                  alt={gift.name}
                  width={360}
                  height={220}
                  className="gift-image"
                />
                <h3>{gift.name}</h3>
                <p>{gift.description}</p>
                <p>
                  <strong>R$ {(gift.priceCents / 100).toFixed(2)}</strong>
                </p>
                <button type="button" className="btn" onClick={() => addToCart(gift)}>
                  Adicionar ao carrinho
                </button>
              </article>
            ))}
          </div>
          {giftFeedback ? <p className="gift-feedback">{giftFeedback}</p> : null}
          <div style={{ marginTop: 12 }}>
            <Link href="/carrinho" className="btn btn-secondary">
              Ver carrinho
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
