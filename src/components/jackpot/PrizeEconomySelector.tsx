import * as React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins, Globe2, Check } from "lucide-react";

export type WalletType = "internal" | "external";

export interface PrizeEconomyValue {
  walletType: WalletType;
  currencyId: string | null;
  amountScale: number;
}

export const DEFAULT_PRIZE_ECONOMY: PrizeEconomyValue = {
  walletType: "external",
  currencyId: null,
  amountScale: 100,
};

/** Virtual store currencies available when walletType === "internal". */
export const VIRTUAL_STORE_CURRENCIES: Array<{ id: string; label: string }> = [
  { id: "COINS", label: "Coins" },
  { id: "GEMS", label: "Gems" },
  { id: "LOYALTY_POINTS", label: "Loyalty Points" },
  { id: "STARS", label: "Stars" },
];

/** ISO real-money currencies exposed when walletType === "external". */
export const ISO_REAL_MONEY_CURRENCIES: Array<{ id: string; label: string }> = [
  { id: "USD", label: "USD — US Dollar" },
  { id: "EUR", label: "EUR — Euro" },
  { id: "GBP", label: "GBP — Pound Sterling" },
  { id: "BRL", label: "BRL — Brazilian Real" },
  { id: "JPY", label: "JPY — Japanese Yen" },
  { id: "CAD", label: "CAD — Canadian Dollar" },
  { id: "AUD", label: "AUD — Australian Dollar" },
];

export function normalizePrizeEconomy(
  v: Partial<PrizeEconomyValue> | undefined,
): PrizeEconomyValue {
  const walletType: WalletType = v?.walletType === "internal" ? "internal" : "external";
  return {
    walletType,
    currencyId: walletType === "internal" ? v?.currencyId ?? null : null,
    amountScale: walletType === "internal" ? 1 : 100,
  };
}

interface Props {
  value: PrizeEconomyValue;
  onChange: (next: PrizeEconomyValue) => void;
  /** Optional override of available virtual store currencies. */
  storeCurrencies?: Array<{ id: string; label: string }>;
}

export function PrizeEconomySelector({
  value,
  onChange,
  storeCurrencies = VIRTUAL_STORE_CURRENCIES,
}: Props) {
  function selectInternal() {
    onChange({
      walletType: "internal",
      currencyId: value.currencyId ?? storeCurrencies[0]?.id ?? null,
      amountScale: 1,
    });
  }
  function selectExternal() {
    onChange({ walletType: "external", currencyId: null, amountScale: 100 });
  }

  const isInternal = value.walletType === "internal";
  const isExternal = value.walletType === "external";

  return (
    <Card className="p-6 bg-neutral-900/50 border-neutral-800">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.18em] text-blue-300 mb-1">
          Prize Economy
        </div>
        <h3 className="text-lg font-semibold text-white">
          Wallet Type & Funding Source
        </h3>
        <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
          Choose the wallet this jackpot contributes to and pays out from. This
          determines decimal handling and the currency selector shown below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EconomyCard
          selected={isInternal}
          onClick={selectInternal}
          icon={<Coins className="w-6 h-6" />}
          title="In-App Virtual Currency"
          tag="Internal"
          accent="amber"
          description="Fuel and pay out this jackpot using your store's digital currency (e.g., Coins, Gems, or Loyalty Points). Built-in safety paths protect balances and prevent double-crediting automatically."
        />
        <EconomyCard
          selected={isExternal}
          onClick={selectExternal}
          icon={<Globe2 className="w-6 h-6" />}
          title="Real Money / Customer Wallet"
          tag="External"
          accent="emerald"
          description="Connect directly to the player's external account balance (e.g., real-money casino bankroll). Payouts and contributions are settled instantly via your integrated player account platform."
        />
      </div>

      {isInternal && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prize-economy-store-currency" className="text-white">
              Select Store Currency
            </Label>
            <Select
              value={value.currencyId ?? ""}
              onValueChange={(v) =>
                onChange({ walletType: "internal", currencyId: v, amountScale: 1 })
              }
            >
              <SelectTrigger
                id="prize-economy-store-currency"
                className="bg-neutral-800 border-neutral-700 text-white"
              >
                <SelectValue placeholder="Choose a virtual currency…" />
              </SelectTrigger>
              <SelectContent>
                {storeCurrencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-neutral-500">
              Integer-only balances. Decimal scale is locked to 1.
            </p>
          </div>
        </div>
      )}

      {isExternal && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prize-economy-iso-currency" className="text-white">
              ISO Currency
            </Label>
            <Select
              value={value.currencyId ?? ""}
              onValueChange={(v) =>
                onChange({ walletType: "external", currencyId: v || null, amountScale: 100 })
              }
            >
              <SelectTrigger
                id="prize-economy-iso-currency"
                className="bg-neutral-800 border-neutral-700 text-white"
              >
                <SelectValue placeholder="Inherit from brand (default)" />
              </SelectTrigger>
              <SelectContent>
                {ISO_REAL_MONEY_CURRENCIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-neutral-500">
              Two-decimal precision. Amount scale = 100 (cents).
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function EconomyCard({
  selected,
  onClick,
  icon,
  title,
  tag,
  description,
  accent,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  tag: string;
  description: string;
  accent: "amber" | "emerald";
}) {
  const ring = selected
    ? accent === "amber"
      ? "border-amber-400/70 ring-2 ring-amber-400/30 bg-amber-400/5"
      : "border-emerald-400/70 ring-2 ring-emerald-400/30 bg-emerald-400/5"
    : "border-neutral-700 hover:border-neutral-500 bg-neutral-800/40";
  const iconBg =
    accent === "amber"
      ? "bg-amber-400/15 text-amber-300"
      : "bg-emerald-400/15 text-emerald-300";
  const tagColor =
    accent === "amber" ? "text-amber-300" : "text-emerald-300";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative text-left rounded-lg border p-5 transition-all ${ring}`}
    >
      {selected && (
        <span className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/95 text-neutral-900">
          <Check className="w-4 h-4" />
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-md flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className={`text-[10px] uppercase tracking-[0.18em] mb-0.5 ${tagColor}`}>
            {tag}
          </div>
          <div className="text-white font-semibold leading-tight">{title}</div>
        </div>
      </div>
      <p className="text-xs text-neutral-300/85 leading-relaxed mt-3">
        {description}
      </p>
    </button>
  );
}
