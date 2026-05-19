import { createFileRoute, Outlet, Link, ClientOnly, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { BackofficeApp } from "../backoffice/app";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/incentiv8-logo.png";

function BackofficeShell({ onLogout, email }: { onLogout: () => void; email: string | null }) {
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
        <img src={logoUrl} alt="Incentiv8" style={{ height: 28, width: "auto" }} />
        <strong style={{ fontSize: 18, letterSpacing: 0.4 }}>Admin</strong>
        <nav style={{ display: "flex", gap: 18, fontSize: 14 }}>
          <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ style: { color: "#fff", textDecoration: "underline" } }} style={{ color: "#9fb0c8", textDecoration: "none" }}>Home</Link>
          <Link to="/admin/jackpots" activeProps={{ style: { color: "#fff", textDecoration: "underline" } }} style={{ color: "#9fb0c8", textDecoration: "none" }}>Jackpots</Link>
          <Link to="/admin/simulator" activeProps={{ style: { color: "#fff", textDecoration: "underline" } }} style={{ color: "#9fb0c8", textDecoration: "none" }}>Simulator</Link>
          <Link to="/admin/users" activeProps={{ style: { color: "#fff", textDecoration: "underline" } }} style={{ color: "#9fb0c8", textDecoration: "none" }}>Users</Link>
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {email && <span style={{ color: "#9fb0c8", fontSize: 12 }}>{email}</span>}
          <button
            onClick={onLogout}
            style={{ background: "transparent", border: "1px solid #1f2a44", color: "#9fb0c8", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
          >
            Logout
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function BackofficeGate() {
  const navigate = useNavigate();
  const [state, setState] = React.useState<{ status: "loading" | "in" | "out"; email: string | null }>({
    status: "loading",
    email: null,
  });

  React.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ status: session ? "in" : "out", email: session?.user.email ?? null });
    });
    supabase.auth.getSession().then(({ data }) => {
      setState({ status: data.session ? "in" : "out", email: data.session?.user.email ?? null });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (state.status === "out") navigate({ to: "/login" });
  }, [state.status, navigate]);

  if (state.status !== "in") {
    return (
      <div style={{ minHeight: "100vh", background: "#0b1220", color: "#e6edf3", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        {state.status === "loading" ? "Loading…" : "Redirecting…"}
      </div>
    );
  }

  return (
    <BackofficeApp>
      <BackofficeShell
        email={state.email}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/login" });
        }}
      />
    </BackofficeApp>
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
      <BackofficeGate />
    </ClientOnly>
  );
}

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: BackofficeLayout,
});
