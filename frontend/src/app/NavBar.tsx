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
    <header className="glass-nav-wrap">
      <div className="glass-nav">
        <Link href="/" className="brand-lockup">
          <span className="brand-name">TingleRadar</span>
          <span className="brand-note">
            {isMobile ? "Quiet ASMR picks" : "Quiet ASMR discovery"}
          </span>
        </Link>
        <nav className="nav-links">
          <Link href="/" className={`nav-link${!isBrowse ? " active" : ""}`}>
            Weekly Board
          </Link>
          <Link href="/browse" className={`nav-link${isBrowse ? " active" : ""}`}>
            Browse All
          </Link>
        </nav>
      </div>
    </header>
  );
}
