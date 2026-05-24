import { useEffect, useRef } from "react";

export type CommunityBreakdown = {
  triggeringPayout: number;
  communityPool: number;
  communitySize: number;
  communityMemberPayOut: number;
  cappedDelta: number;
};

export type WinInfo = {
  jackpotName?: string;
  amount?: number;
  community?: CommunityBreakdown | null;
};

export type WinAnimationVariant = "default" | "mega" | "coin-storm";

const fmt = (n: number, currency = "EUR") => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `€${n.toFixed(2)}`;
  }
};

export function WinCelebration({
  info,
  variant = "default",
  onClose,
}: {
  info: WinInfo | null;
  variant?: WinAnimationVariant;
  onClose: () => void;
}) {
  const lockRef = useRef(false);

  useEffect(() => {
    if (!info) {
      lockRef.current = false;
      return;
    }
    lockRef.current = true;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        lockRef.current = false;
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [info, onClose]);

  if (!info) return null;

  const particleCount = variant === "coin-storm" ? 80 : 120;
  const variantClass = `dwc-variant-${variant}`;

  return (
    <>
      <style>{styles}</style>
      <div
        className={`dwc-backdrop ${variantClass}`}
        role="dialog"
        aria-modal="true"
        aria-label="Jackpot win"
        onClick={() => {
          lockRef.current = false;
          onClose();
        }}
      >
        <div className="dwc-confetti" aria-hidden>
          {Array.from({ length: particleCount }).map((_, i) => (
            <span key={i} style={{ ["--i" as never]: i }}>
              {variant === "coin-storm" ? "●" : ""}
            </span>
          ))}
        </div>
        <div className="dwc-panel" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="dwc-close"
            onClick={() => {
              lockRef.current = false;
              onClose();
            }}
            aria-label="Close win animation"
          >
            ×
          </button>
          <div className="dwc-coin" aria-hidden>
            €
          </div>
          <div className="dwc-title">
            CONGRATS!
            <br />
            YOU WON THE JACKPOT!
          </div>
          {info.jackpotName && <div className="dwc-sub">{info.jackpotName}</div>}
          {typeof info.amount === "number" && info.amount > 0 && (
            <div className="dwc-amount">{fmt(info.amount)}</div>
          )}
          {info.community && (
            <div className="dwc-community">
              <div className="dwc-community-badge">Community Payout Triggered</div>
              <div>
                Triggering Winner Payout:{" "}
                <strong>{fmt(info.community.triggeringPayout)}</strong>
              </div>
              <div>
                Community Split: <strong>{fmt(info.community.communityPool)}</strong>{" "}
                across <strong>{info.community.communitySize}</strong> players (
                <strong>{fmt(info.community.communityMemberPayOut)}</strong> each).
              </div>
              {info.community.cappedDelta > 0 && (
                <div className="dwc-community-cap">
                  Per-member cap applied — delta {fmt(info.community.cappedDelta)} returned
                  to house.
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            className="dwc-cta"
            onClick={() => {
              lockRef.current = false;
              onClose();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

const styles = `
.dwc-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  background: radial-gradient(ellipse at center, rgba(76,29,149,.85) 0%, rgba(2,6,23,.94) 70%);
  display: flex; align-items: center; justify-content: center;
  padding: 24px; backdrop-filter: blur(6px);
  animation: dwc-fade-in 220ms ease;
}
.dwc-variant-mega {
  background: radial-gradient(ellipse at center, rgba(190,18,60,.85) 0%, rgba(2,6,23,.96) 70%);
}
.dwc-variant-coin-storm {
  background: radial-gradient(ellipse at center, rgba(180,83,9,.85) 0%, rgba(2,6,23,.94) 70%);
}
.dwc-confetti { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.dwc-confetti span {
  position: absolute; top: 50%; left: 50%;
  width: 10px; height: 18px; border-radius: 2px;
  background: hsl(calc(var(--i) * 30deg), 95%, 62%);
  transform-origin: center;
  animation: dwc-burst 2.4s ease-out infinite;
  animation-delay: calc(var(--i) * 18ms);
  box-shadow: 0 0 8px rgba(255,255,255,.4);
  color: #fde047; font-size: 14px; line-height: 18px; text-align: center;
}
.dwc-variant-coin-storm .dwc-confetti span {
  width: 16px; height: 16px; border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #fde047, #b45309);
  box-shadow: 0 0 12px rgba(250,204,21,.6);
}
@keyframes dwc-burst {
  0%   { transform: translate(-50%,-50%) rotate(0) translateY(0) scale(1); opacity: 1; }
  100% {
    transform: translate(-50%,-50%) rotate(calc(var(--i) * 17deg))
               translateY(calc(-40vh - (var(--i) * 1.5px))) rotate(900deg) scale(.5);
    opacity: 0;
  }
}
.dwc-panel {
  position: relative; z-index: 1;
  background: linear-gradient(160deg, #1e1b4b 0%, #0f172a 100%);
  border: 2px solid #facc15;
  border-radius: 20px;
  padding: 40px 36px 28px;
  max-width: 520px; width: 100%;
  text-align: center;
  box-shadow: 0 40px 100px rgba(0,0,0,.7), 0 0 80px rgba(250,204,21,.35), inset 0 1px 0 rgba(255,255,255,.08);
  animation: dwc-modal-in 320ms cubic-bezier(.2,.9,.3,1.3);
}
.dwc-variant-mega .dwc-panel { border-color: #f43f5e; box-shadow: 0 40px 100px rgba(0,0,0,.7), 0 0 80px rgba(244,63,94,.45); }
.dwc-close {
  position: absolute; top: 12px; right: 14px;
  width: 36px; height: 36px; border-radius: 999px;
  background: rgba(255,255,255,.08); color: #fde047;
  border: 1px solid rgba(250,204,21,.4);
  font-size: 22px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .2s, transform .2s;
}
.dwc-close:hover { background: rgba(250,204,21,.2); transform: scale(1.08); }
.dwc-coin {
  width: 92px; height: 92px; margin: 0 auto 16px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #fef3c7, #f59e0b 60%, #b45309);
  color: #78350f; font-size: 52px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 30px rgba(245,158,11,.5), inset 0 -6px 12px rgba(0,0,0,.2);
  animation: dwc-coin-spin 2s ease-in-out infinite;
}
.dwc-variant-mega .dwc-coin { animation: dwc-coin-spin 1s ease-in-out infinite; }
@keyframes dwc-coin-spin {
  0%, 100% { transform: rotateY(0deg) scale(1); }
  50%      { transform: rotateY(180deg) scale(1.06); }
}
.dwc-title {
  font-size: 32px; font-weight: 900; line-height: 1.15;
  color: #fde047; text-shadow: 0 0 24px rgba(250,204,21,.7);
  margin-bottom: 8px; animation: dwc-pop .6s ease-out;
}
.dwc-sub {
  font-size: 13px; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: #f9a8d4; margin-bottom: 14px;
}
.dwc-amount {
  font-size: 44px; font-weight: 900; color: #fff;
  font-variant-numeric: tabular-nums; margin: 8px 0 18px;
  text-shadow: 0 0 30px rgba(255,255,255,.4);
  animation: dwc-pop .8s ease-out;
}
.dwc-community {
  text-align: left; font-size: 12px; color: #d1fae5;
  background: rgba(16,185,129,.12); border: 1px solid rgba(52,211,153,.45);
  border-radius: 12px; padding: 12px 14px; margin: 6px 0 18px;
  display: flex; flex-direction: column; gap: 4px;
}
.dwc-community-badge {
  align-self: flex-start;
  font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
  background: #10b981; color: #022c22;
  padding: 3px 8px; border-radius: 999px; margin-bottom: 4px;
}
.dwc-community strong { color: #fde047; }
.dwc-community-cap { color: #fcd34d; }
.dwc-cta {
  margin-top: 6px;
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #1e293b; font-weight: 800; letter-spacing: .04em;
  padding: 10px 28px; border: none; border-radius: 999px;
  cursor: pointer; font-size: 14px;
  box-shadow: 0 6px 20px rgba(245,158,11,.5);
  transition: transform .15s, box-shadow .15s;
}
.dwc-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(245,158,11,.7); }
@keyframes dwc-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes dwc-modal-in {
  from { transform: translateY(20px) scale(.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes dwc-pop {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}
`;
