import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import {
  listUsers,
  inviteUser,
  setUserEnabled,
  deleteUser,
  setUserPassword,
} from "@/lib/users.functions";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  component: UsersPage,
});

const cellStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #1f2a44", fontSize: 13 };
const btn: React.CSSProperties = { background: "transparent", border: "1px solid #334155", color: "#e6edf3", padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const input: React.CSSProperties = { background: "#0b1220", border: "1px solid #1f2a44", borderRadius: 6, padding: "8px 10px", color: "#e6edf3", fontSize: 13 };

function UsersPage() {
  const list = useServerFn(listUsers);
  const invite = useServerFn(inviteUser);
  const setEnabled = useServerFn(setUserEnabled);
  const del = useServerFn(deleteUser);
  const setPwd = useServerFn(setUserPassword);
  const qc = useQueryClient();

  const usersQ = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const inviteM = useMutation({
    mutationFn: (vars: { email: string; password: string; displayName: string; role: "admin" | "user" }) =>
      invite({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  const enableM = useMutation({
    mutationFn: (vars: { userId: string; enabled: boolean }) => setEnabled({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (e: any) => setFeedback(e?.message ?? "Failed to update user"),
  });
  const deleteM = useMutation({
    mutationFn: (vars: { userId: string }) => del({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (e: any) => setFeedback(e?.message ?? "Failed to delete user"),
  });
  const setPwdM = useMutation({
    mutationFn: (vars: { userId: string; password: string }) => setPwd({ data: vars }),
    onSuccess: () => setFeedback("Password updated."),
    onError: (e: any) => setFeedback(e?.message ?? "Failed to set password"),
  });

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [role, setRole] = React.useState<"admin" | "user">("admin");
  const [feedback, setFeedback] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    try {
      await inviteM.mutateAsync({ email, password, displayName, role });
      setEmail(""); setPassword(""); setDisplayName("");
      setFeedback("User created");
    } catch (err: any) {
      setFeedback(err?.message ?? "Failed to create user");
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Users</h1>

      <section style={{ background: "#0f172a", border: "1px solid #1f2a44", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Invite a user</h2>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.6fr auto", gap: 10, alignItems: "end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#9fb0c8" }}>EMAIL</span>
            <input style={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#9fb0c8" }}>DISPLAY NAME</span>
            <input style={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#9fb0c8" }}>TEMP PASSWORD</span>
            <input style={input} type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#9fb0c8" }}>ROLE</span>
            <select style={input} value={role} onChange={(e) => setRole(e.target.value as "admin" | "user")}>
              <option value="admin">admin</option>
              <option value="user">user</option>
            </select>
          </label>
          <button type="submit" disabled={inviteM.isPending} style={{ ...btn, background: "#6366f1", borderColor: "#6366f1", padding: "8px 14px" }}>
            {inviteM.isPending ? "Creating…" : "Create"}
          </button>
        </form>
        {feedback && <p style={{ marginTop: 10, color: feedback === "User created" ? "#86efac" : "#fca5a5", fontSize: 13 }}>{feedback}</p>}
      </section>

      <section style={{ background: "#0f172a", border: "1px solid #1f2a44", borderRadius: 12, overflow: "hidden" }}>
        {usersQ.isLoading ? (
          <div style={{ padding: 20, color: "#9fb0c8" }}>Loading…</div>
        ) : usersQ.error ? (
          <div style={{ padding: 20, color: "#fca5a5" }}>Error: {(usersQ.error as Error).message}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111d36", color: "#9fb0c8", fontSize: 12, textAlign: "left" }}>
                <th style={cellStyle}>Email</th>
                <th style={cellStyle}>Name</th>
                <th style={cellStyle}>Roles</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(usersQ.data ?? []).map((u) => (
                <tr key={u.user_id}>
                  <td style={cellStyle}>{u.email}</td>
                  <td style={cellStyle}>{u.display_name ?? "—"}</td>
                  <td style={cellStyle}>{u.roles.join(", ") || "—"}</td>
                  <td style={cellStyle}>
                    <span style={{ color: u.enabled ? "#86efac" : "#fca5a5" }}>
                      {u.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        style={btn}
                        onClick={() => {
                          const pwd = prompt(`Set new password for ${u.email} (min 8 chars):`);
                          if (pwd && pwd.length >= 8) {
                            setPwdM.mutate({ userId: u.user_id, password: pwd });
                          } else if (pwd !== null) {
                            setFeedback("Password must be at least 8 characters.");
                          }
                        }}
                      >
                        {setPwdM.isPending ? "…" : "Set password"}
                      </button>
                      <button style={btn} onClick={() => enableM.mutate({ userId: u.user_id, enabled: !u.enabled })}>
                        {u.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        style={{ ...btn, borderColor: "#7f1d1d", color: "#fca5a5" }}
                        onClick={() => {
                          if (confirm(`Delete ${u.email}? This cannot be undone.`)) {
                            deleteM.mutate({ userId: u.user_id });
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
