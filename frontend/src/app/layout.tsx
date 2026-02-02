import React from "react";
import "./globals.css";
import { NavBar } from "./NavBar";

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
        <NavBar />
        {children}
      </body>
    </html>
  );
}
