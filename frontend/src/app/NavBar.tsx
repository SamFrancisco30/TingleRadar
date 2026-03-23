"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();
  const isBrowse = pathname.startsWith("/browse");

  return (
    <header className="glass-nav-wrap">
      <div className="glass-nav">
        <Link href="/" className="brand-lockup">
          <span className="brand-name">TingleRadar</span>
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
