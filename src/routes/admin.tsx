import { createFileRoute, Outlet, Link, ClientOnly } from "@tanstack/react-router";
import * as React from "react";
import { BackofficeApp } from "../backoffice/app";
import logoUrl from "@/assets/incentiv8-logo.png";

const AUTH_KEY = "in8_backoffice_auth";
const ADMIN_USER = "Admin";
const ADMIN_PASS = "7QiR}K1R4@6q";

function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTimeout(() => {
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        try {
          localStorage.setItem(AUTH_KEY, "1");
        } catch {}
        onSuccess();
      } else {
        setError("Invalid username or password");
      }
      setLoading(false);
    }, 200);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 20%, #1e1b4b 0%, #0b1220 50%, #000 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid #1f2a44",
          borderRadius: 16,
          padding: 36,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <img src={logoUrl} alt="Incentiv8" style={{ height: 56, width: "auto" }} />
        </div>
        <h1
          style={{
            color: "#e6edf3",
            fontSize: 22,
            fontWeight: 600,
            margin: "0 0 6px",
            textAlign: "center",
          }}
        >
          Backoffice Login
        </h1>
        <p style={{ color: "#9fb0c8", fontSize: 13, textAlign: "center", margin: "0 0 24px" }}>
          Sign in to continue
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#9fb0c8", fontSize: 12, letterSpacing: 0.4 }}>USERNAME</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              style={inputStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#9fb0c8", fontSize: 12, letterSpacing: 0.4 }}>PASSWORD</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </label>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              cursor: loading ? "default" : "pointer",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 0.3,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2a44",
  borderRadius: 8,
  padding: "11px 12px",
  color: "#e6edf3",
  fontSize: 14,
  outline: "none",
};

function BackofficeShell({ onLogout }: { onLogout: () => void }) {
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
        <strong style={{ fontSize: 18, letterSpacing: 0.4 }}>Insentiv8 Backoffice</strong>
        <nav style={{ display: "flex", gap: 18, fontSize: 14 }}>
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            activeProps={{ style: { color: "#fff", textDecoration: "underline" } }}
            style={{ color: "#9fb0c8", textDecoration: "none" }}
          >
            Home
          </Link>
          <Link
            to="/admin/jackpots"
            activeProps={{ style: { color: "#fff", textDecoration: "underline" } }}
            style={{ color: "#9fb0c8", textDecoration: "none" }}
          >
            Jackpots
          </Link>
          <Link
            to="/admin/simulator"
            activeProps={{ style: { color: "#fff", textDecoration: "underline" } }}
            style={{ color: "#9fb0c8", textDecoration: "none" }}
          >
            Simulator
          </Link>
        </nav>
        <button
          onClick={onLogout}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "1px solid #1f2a44",
            color: "#9fb0c8",
            padding: "6px 12px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Logout
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function BackofficeGate() {
  const [authed, setAuthed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />;
  }

  return (
    <BackofficeApp>
      <BackofficeShell
        onLogout={() => {
          try {
            localStorage.removeItem(AUTH_KEY);
          } catch {}
          setAuthed(false);
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
