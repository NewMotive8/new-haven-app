import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/incentiv8-logo.png";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

const inputStyle: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2a44",
  borderRadius: 8,
  padding: "11px 12px",
  color: "#e6edf3",
  fontSize: 14,
  outline: "none",
};

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/admin" });
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
        <h1 style={{ color: "#e6edf3", fontSize: 22, fontWeight: 600, margin: "0 0 6px", textAlign: "center" }}>
          Backoffice Login
        </h1>
        <p style={{ color: "#9fb0c8", fontSize: 13, textAlign: "center", margin: "0 0 24px" }}>
          Sign in to continue
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#9fb0c8", fontSize: 12, letterSpacing: 0.4 }}>EMAIL</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#9fb0c8", fontSize: 12, letterSpacing: 0.4 }}>PASSWORD</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required style={inputStyle} />
          </label>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
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
          <ForgotPassword email={email} />
        </form>
      </div>
    </div>
  );
}

function ForgotPassword({ email }: { email: string }) {
  const [sent, setSent] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function handle() {
    setErr(null);
    if (!email) {
      setErr("Enter your email above first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div style={{ textAlign: "center", marginTop: 4 }}>
      {sent ? (
        <span style={{ color: "#86efac", fontSize: 12 }}>Reset email sent (check spam)</span>
      ) : (
        <button type="button" onClick={handle} style={{ background: "transparent", border: "none", color: "#9fb0c8", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
          Forgot password?
        </button>
      )}
      {err && <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 4 }}>{err}</div>}
    </div>
  );
}
