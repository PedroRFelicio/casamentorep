"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "#convite", label: "Convite" },
  { href: "#sobre-noivos", label: "Sobre os noivos" },
  { href: "#local-hospedagem", label: "Local" },
  { href: "#dress-code", label: "Dress code" },
  { href: "#confirmacao", label: "Confirmação de presença" },
  { href: "#presentes", label: "Lista de presentes" }
];

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="topbar">
      <nav className="container topbar-nav">
        <div className="brand-block">
          <p className="brand-names">Jônatas e Nadjilla</p>
          <p className="brand-date">04/07/2026</p>
        </div>
        <div className="topbar-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={isHome ? link.href : `/${link.href}`}
              className="topbar-link"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
