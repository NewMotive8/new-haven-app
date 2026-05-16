import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BrandContext } from "../backoffice/app";
import {
  JackpotCreationForm,
  type JackpotSavePayload,
} from "@/components/jackpot/JackpotCreationForm";
import { buildCreateBody } from "@/lib/jackpot/build-create-body";

function NewJackpotPage() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSave(payload: JackpotSavePayload) {
    if (!payload.name) {
      toast.error("Jackpot name is required");
      return;
    }
    if (brandId == null) {
      toast.error("No brand selected");
      return;
    }
    setSubmitting(true);
    try {
      // Seed amount derived from contribution model (fallback 1000 if not yet entered in the visual fields)
      const seedAmount = 1000;
      const contributionRate = payload.poolPercentageValue / 100;
      const body = {
        name: payload.name,
        enabled: true,
        contributionRate,
        seedAmount,
        poolBalance: seedAmount,
        triggerThreshold: seedAmount * 2,
        volatility: payload.volatility,
        jackpotType: payload.type,
        config: buildTriggerCondition(payload),
      };
      await axios.post("/api/v1/jackpots", body, {
        headers: { brandId: String(brandId), "Content-Type": "application/json" },
      });
      toast.success("Jackpot created");
      navigate({ to: "/admin/jackpots" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        "Failed to create jackpot";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <JackpotCreationForm
      onSave={handleSave}
      submitting={submitting}
      onCancel={() => navigate({ to: "/admin/jackpots" })}
    />
  );
}

export const Route = createFileRoute("/admin/jackpots/new")({
  ssr: false,
  component: NewJackpotPage,
});
