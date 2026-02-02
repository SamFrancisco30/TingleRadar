import React from "react";
import "./globals.css";

export const metadata = {
  title: "TingleRadar",
  description: "ASMR leaderboard and discovery experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        }}
      >
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
            <a
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
            </a>
            <nav
              style={{
                display: "flex",
                gap: "1.25rem",
                fontSize: "0.85rem",
                alignItems: "center",
              }}
            >
              <a
                href="/"
                style={{
                  color: "#e5e7eb",
                  textDecoration: "none",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.4rem",
                  borderBottom: "2px solid transparent",
                }}
              >
                Weekly Board
              </a>
              <a
                href="/browse"
                style={{
                  color: "#9ca3af",
                  textDecoration: "none",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.4rem",
                  borderBottom: "2px solid transparent",
                }}
              >
                Browse All
              </a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
