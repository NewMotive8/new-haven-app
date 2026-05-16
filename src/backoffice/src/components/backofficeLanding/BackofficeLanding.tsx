import React from "react";
import {
  FaCoins,
  FaPlay,
  FaCircleNotch,
  FaTicketAlt,
  FaBolt,
  FaTrophy,
  FaUsersCog,
  FaDatabase,
  FaRocket,
} from "react-icons/fa";
import { Link } from "@tanstack/react-router";
import TextTranslated from "../TextTranslated";

type CardDef = {
  title: string;
  description: string;
  to?: string;
  icon: React.ReactNode;
};

const ACTIVE: CardDef[] = [
  {
    title: "Jackpots",
    description: "Browse, configure and inspect jackpot definitions.",
    to: "/backoffice/jackpots",
    icon: <FaCoins size={22} />,
  },
];

const COMING_SOON: CardDef[] = [
  { title: "Simulator", description: "Run bet simulations against a jackpot.", icon: <FaPlay size={22} /> },
  { title: "Lucky Wheel", description: "Manage wheel campaigns and prizes.", icon: <FaCircleNotch size={22} /> },
  { title: "Raffles", description: "Schedule and draw raffle campaigns.", icon: <FaTicketAlt size={22} /> },
  { title: "Spin Sprint", description: "Time-boxed spin competitions.", icon: <FaBolt size={22} /> },
  { title: "Tournament", description: "Leaderboard-driven tournaments.", icon: <FaTrophy size={22} /> },
  { title: "Admin", description: "Brands, users and exchange rates.", icon: <FaUsersCog size={22} /> },
  { title: "Root / Catalog", description: "Currencies, operators, products, tiers.", icon: <FaDatabase size={22} /> },
];

const panelBase: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #1f2a44",
  borderRadius: 12,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minHeight: 140,
  position: "relative",
  textDecoration: "none",
  color: "#e6edf3",
  transition: "transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
};

const pillBase: React.CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  fontSize: 11,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  padding: "3px 8px",
  borderRadius: 999,
  fontWeight: 600,
};

function CardShell({ card, active }: { card: CardDef; active: boolean }) {
  const [hover, setHover] = React.useState(false);

  const style: React.CSSProperties = {
    ...panelBase,
    cursor: active ? "pointer" : "not-allowed",
    opacity: active ? 1 : 0.55,
    borderColor: active && hover ? "#4f46e5" : "#1f2a44",
    transform: active && hover ? "translateY(-2px)" : "none",
    boxShadow: active && hover ? "0 8px 24px rgba(79, 70, 229, 0.25)" : "none",
  };

  const iconWrap: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  };

  const pill: React.CSSProperties = {
    ...pillBase,
    background: active ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)",
    color: active ? "#4ade80" : "#94a3b8",
    border: `1px solid ${active ? "rgba(74,222,128,0.4)" : "rgba(148,163,184,0.35)"}`,
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={style}
    >
      <div style={pill}>{active ? "Open" : "Coming soon"}</div>
      <div style={iconWrap}>{card.icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{card.title}</div>
      <div style={{ fontSize: 13, color: "#9fb0c8", lineHeight: 1.45 }}>{card.description}</div>
    </div>
  );
}

const BackofficeLanding: React.FC = () => {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <FaRocket color="#6366f1" />
        <span style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#9fb0c8" }}>
          Engagd Backoffice
        </span>
      </div>
      <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700, color: "#f8fafc" }}>
        Pick a module to get started
      </h1>
      <p style={{ margin: "0 0 24px", color: "#9fb0c8", fontSize: 14 }}>
        Active modules link to their screen. Greyed tiles are part of the legacy backoffice and will
        light up as we port them.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {ACTIVE.map((card) => (
          <Link key={card.title} to={card.to!} style={{ textDecoration: "none" }}>
            <CardShell card={card} active />
          </Link>
        ))}
        {COMING_SOON.map((card) => (
          <CardShell key={card.title} card={card} active={false} />
        ))}
      </div>

      <p style={{ marginTop: 28, color: "#64748b", fontSize: 12, textAlign: "center" }}>
        <TextTranslated group="backoffice-home" key="noDefaultPage" />
      </p>
    </div>
  );
};

export default BackofficeLanding;
