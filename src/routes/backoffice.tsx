import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import * as React from "react";
import { BackofficeApp } from "../backoffice/app";

// Inline landing — Step 1. The real BackofficeLanding lives at
// src/backoffice/src/components/backofficeLanding/BackofficeLanding.tsx and
// will be wired in once the UI-kit dependency tree (Typography, Grid, SCSS
// variables) is ported in Step 2.
function BackofficeLanding() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#0b1220",
        color: "#e6edf3",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 640 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 18px",
            borderRadius: 999,
            background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            fontWeight: 600,
            letterSpacing: 0.4,
            marginBottom: 24,
          }}
        >
          🚀 Engagd Backoffice 🛠
        </div>
        <h1 style={{ fontSize: 32, margin: "0 0 12px" }}>Backoffice shell is online</h1>
        <p style={{ opacity: 0.75, lineHeight: 1.5 }}>
          Step 1 complete — provider stack (QueryClient, Auth, Brand, Global, Dialog, Toast) is
          wired and the route is mounted at <code>/backoffice</code>. Next step ports the UI-kit
          (Grid, Typography, Navbar, SideMenu) and the first real screens (Jackpots, Simulator).
        </p>
      </div>
    </div>
  );
}

function BackofficePage() {
  return (
    <ClientOnly fallback={null}>
      <BackofficeApp>
        <BackofficeLanding />
      </BackofficeApp>
    </ClientOnly>
  );
}

export const Route = createFileRoute("/backoffice")({
  ssr: false,
  component: BackofficePage,
});
