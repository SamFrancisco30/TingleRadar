import React from "react";
import "./globals.css";
import { NavBar } from "./NavBar";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
      <body className="app-body">
        <div className="app-shell">
          <NavBar />
        </div>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
