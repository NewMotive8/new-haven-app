import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { toast } from "sonner";
import { Sparkles, Layers } from "lucide-react";
import { BrandContext } from "@/backoffice/app";
import {
  JackpotCreationForm,
  type JackpotSavePayload,
} from "@/components/jackpot/JackpotCreationForm";
import { MultiJackpotWizard } from "@/components/jackpot/MultiJackpotWizard";
import { buildCreateBody } from "@/lib/jackpot/build-create-body";

type Tab = "single" | "multi";

function NewJackpotPage() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("single");

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
      const body = buildCreateBody(payload);
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
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <h1 className="text-2xl font-semibold mb-1">
          {tab === "single" ? "Create Jackpot" : "Create MultiJackpot"}
        </h1>
        <p className="text-sm text-neutral-400 mb-6">
          {tab === "single"
            ? "Configure a standalone jackpot from scratch."
            : "Group existing jackpots into a tiered MultiJackpot."}
        </p>

        <div className="inline-flex rounded-lg bg-neutral-900 border border-neutral-800 p-1 mb-8">
          <TabButton active={tab === "single"} onClick={() => setTab("single")}>
            <Sparkles className="w-4 h-4 mr-1" /> Single Jackpot
          </TabButton>
          <TabButton active={tab === "multi"} onClick={() => setTab("multi")}>
            <Layers className="w-4 h-4 mr-1" /> MultiJackpot
          </TabButton>
        </div>
      </div>

      {tab === "single" ? (
        <JackpotCreationForm
          onSave={handleSave}
          submitting={submitting}
          onCancel={() => navigate({ to: "/admin/jackpots" })}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <MultiJackpotWizard />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-violet-500 text-white"
          : "text-neutral-300 hover:text-white hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

export const Route = createFileRoute("/admin/jackpots/new")({
  ssr: false,
  component: NewJackpotPage,
});
