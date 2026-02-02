"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();
  const isBrowse = pathname.startsWith("/browse");

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(12px)",
        background: "rgba(3, 7, 18, 0.8)",
        borderBottom: "1px solid #111827",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "0.7rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "1.05rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#e5e7eb",
            textDecoration: "none",
          }}
        >
          TingleRadar
        </Link>
        <nav
          style={{
            display: "flex",
            gap: "1.25rem",
            fontSize: "0.85rem",
            alignItems: "center",
          }}
        >
          <Link
            href="/"
            style={{
              color: !isBrowse ? "#e5e7eb" : "#9ca3af",
              textDecoration: "none",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0.25rem 0.4rem",
              borderBottom: `2px solid ${!isBrowse ? "#f97316" : "transparent"}`,
            }}
          >
            Weekly Board
          </Link>
          <Link
            href="/browse"
            style={{
              color: isBrowse ? "#e5e7eb" : "#9ca3af",
              textDecoration: "none",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0.25rem 0.4rem",
              borderBottom: `2px solid ${isBrowse ? "#f97316" : "transparent"}`,
            }}
          >
            Browse All
          </Link>
        </nav>
      </div>
    </header>
  );
}
