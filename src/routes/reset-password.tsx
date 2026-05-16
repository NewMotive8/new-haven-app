import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/incentiv8-logo.png";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
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

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    // Supabase recovery link sets session via URL hash automatically
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    navigate({ to: "/admin" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 20% 20%, #1e1b4b 0%, #0b1220 50%, #000 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "rgba(15, 23, 42, 0.85)", border: "1px solid #1f2a44", borderRadius: 16, padding: 36 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <img src={logoUrl} alt="Incentiv8" style={{ height: 48, width: "auto" }} />
        </div>
        <h1 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 600, margin: "0 0 24px", textAlign: "center" }}>
          Set a new password
        </h1>
        {!ready ? (
          <p style={{ color: "#9fb0c8", fontSize: 13, textAlign: "center" }}>
            Open this page from the reset link in your email.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ color: "#9fb0c8", fontSize: 12 }}>NEW PASSWORD</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ color: "#9fb0c8", fontSize: 12 }}>CONFIRM PASSWORD</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={inputStyle} />
            </label>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>{error}</div>
            )}
            <button type="submit" disabled={loading} style={{ marginTop: 8, padding: "12px 16px", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #6366f1, #8b5cf6, #3b82f6)", color: "#fff", fontWeight: 600 }}>
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
