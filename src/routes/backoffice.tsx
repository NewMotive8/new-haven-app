import { createFileRoute, Outlet, Link, ClientOnly } from "@tanstack/react-router";
import * as React from "react";
import { BackofficeApp } from "../backoffice/app";

function BackofficeShell() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b1220", color: "#e6edf3", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "14px 28px",
          borderBottom: "1px solid #1f2a44",
          background: "#0f172a",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <strong style={{ fontSize: 18, letterSpacing: 0.4 }}>Insentiv8 Backoffice</strong>
        <nav style={{ display: "flex", gap: 18, fontSize: 14 }}>
          <Link
            to="/backoffice"
            activeOptions={{ exact: true }}
            activeProps={{ style: { color: "#fff", textDecoration: "underline" } }}
            style={{ color: "#9fb0c8", textDecoration: "none" }}
          >
            Home
          </Link>
          <Link
            to="/backoffice/jackpots"
            activeProps={{ style: { color: "#fff", textDecoration: "underline" } }}
            style={{ color: "#9fb0c8", textDecoration: "none" }}
          >
            Jackpots
          </Link>
          <Link
            to="/backoffice/simulator"
            activeProps={{ style: { color: "#fff", textDecoration: "underline" } }}
            style={{ color: "#9fb0c8", textDecoration: "none" }}
          >
            Simulator
          </Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function BackofficeLayout() {
  return (
    <ClientOnly
      fallback={
        <div style={{ minHeight: "100vh", background: "#0b1220", color: "#e6edf3", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
          Loading Backoffice…
        </div>
      }
    >
      <BackofficeApp>
        <BackofficeShell />
      </BackofficeApp>
    </ClientOnly>
  );
}

export const Route = createFileRoute("/backoffice")({
  ssr: false,
  component: BackofficeLayout,
});
