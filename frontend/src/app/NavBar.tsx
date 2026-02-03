"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavBar() {
  const pathname = usePathname();
  const isBrowse = pathname.startsWith("/browse");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = (e: MediaQueryList | MediaQueryListEvent) => {
      const matches = "matches" in e ? e.matches : (e as MediaQueryList).matches;
      setIsMobile(matches);
    };
    update(mq);
    mq.addEventListener("change", update as any);
    return () => mq.removeEventListener("change", update as any);
  }, []);

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
          justifyContent: isMobile ? "center" : "space-between",
          flexDirection: isMobile ? "column" : "row",
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
            marginTop: isMobile ? "0.4rem" : 0,
            justifyContent: "center",
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
              borderBottom: `2px solid ${!isBrowse ? "#c084fc" : "transparent"}`,
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
              borderBottom: `2px solid ${isBrowse ? "#c084fc" : "transparent"}`,
            }}
          >
            Browse All
          </Link>
        </nav>
      </div>
    </header>
  );
}
