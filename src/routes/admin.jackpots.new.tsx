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
import { dtoToPayload } from "@/lib/jackpot/dto-to-payload";
import type { JackpotDTO } from "@/lib/jackpot/types";

type Tab = "single" | "multi";

type NewSearch = {
  editId?: number;
  cloneFrom?: number;
  draftId?: number;
  tab?: Tab;
};

function NewJackpotPage() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const search = Route.useSearch();
  const editId = search.editId ?? search.draftId;
  const cloneFrom = search.cloneFrom;
  const isEditing = editId != null && cloneFrom == null;

  const [submitting, setSubmitting] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("single");
  const [initialDraft, setInitialDraft] = React.useState<JackpotSavePayload | undefined>(undefined);
  const [loading, setLoading] = React.useState<boolean>(editId != null || cloneFrom != null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Hydrate from server when editId / cloneFrom is present.
  React.useEffect(() => {
    const targetId = editId ?? cloneFrom;
    if (targetId == null || brandId == null) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await axios.get<JackpotDTO>(`/api/v1/jackpots/${targetId}`, {
          headers: { brandId: String(brandId) },
        });
        if (cancelled) return;
        // Tier children must be edited via their parent group, never as standalones.
        if (res.data.groupId != null) {
          toast.info("This jackpot belongs to a MultiJackpot — opening group editor.");
          navigate({
            to: "/admin/jackpot-groups/$id",
            params: { id: String(res.data.groupId) },
            replace: true,
          });
          return;
        }
        const payload = dtoToPayload(res.data);
        if (cloneFrom != null) {
          payload.name = `${payload.name ?? ""} (Copy)`.trim();
        }
        setInitialDraft(payload);
        setTab("single");
      } catch (err: any) {
        if (cancelled) return;
        setLoadError(err?.response?.data?.error ?? err?.message ?? "Failed to load jackpot");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, cloneFrom, brandId, navigate]);

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
      if (isEditing && editId != null) {
        await axios.put(`/api/v1/jackpots/${editId}`, body, {
          headers: { brandId: String(brandId), "Content-Type": "application/json" },
        });
        toast.success("Jackpot updated");
      } else {
        await axios.post("/api/v1/jackpots", body, {
          headers: { brandId: String(brandId), "Content-Type": "application/json" },
        });
        toast.success(cloneFrom != null ? "Jackpot cloned" : "Jackpot created");
      }
      navigate({ to: "/admin/jackpots" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } }; message?: string })
          ?.response?.data?.error ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as { message?: string })?.message ??
        "Failed to save jackpot";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const title = isEditing
    ? "Edit Jackpot"
    : cloneFrom != null
      ? "Clone Jackpot"
      : tab === "single"
        ? "Create Jackpot"
        : "Create MultiJackpot";

  const subtitle = isEditing
    ? "Update an existing jackpot configuration."
    : cloneFrom != null
      ? "Review and save a duplicated jackpot."
      : tab === "single"
        ? "Configure a standalone jackpot from scratch."
        : "Group existing jackpots into a tiered MultiJackpot.";

  // Hide the tab switcher when editing/cloning — context is locked to single.
  const showTabs = !isEditing && cloneFrom == null;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-10">Loading jackpot…</div>
    );
  }
  if (loadError) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-10">
        <p className="text-red-400">Failed to load: {loadError}</p>
        <button
          type="button"
          className="mt-4 text-blue-400 underline"
          onClick={() => navigate({ to: "/admin/jackpots" })}
        >
          ← Back to jackpots
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <h1 className="text-2xl font-semibold mb-1">{title}</h1>
        <p className="text-sm text-neutral-400 mb-6">{subtitle}</p>

        {showTabs && (
          <div className="inline-flex rounded-lg bg-neutral-900 border border-neutral-800 p-1 mb-8">
            <TabButton active={tab === "single"} onClick={() => setTab("single")}>
              <Sparkles className="w-4 h-4 mr-1" /> Single Jackpot
            </TabButton>
            <TabButton active={tab === "multi"} onClick={() => setTab("multi")}>
              <Layers className="w-4 h-4 mr-1" /> MultiJackpot
            </TabButton>
          </div>
        )}
      </div>

      {tab === "single" || !showTabs ? (
        <JackpotCreationForm
          key={editId != null ? `edit-${editId}` : cloneFrom != null ? `clone-${cloneFrom}` : "new"}
          onSave={handleSave}
          submitting={submitting}
          onCancel={() => navigate({ to: "/admin/jackpots" })}
          initialDraft={initialDraft}
          saveLabel={isEditing ? "Save changes" : undefined}
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
          : "text-neutral-300 bg-neutral-800 hover:text-white hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

export const Route = createFileRoute("/admin/jackpots/new")({
  ssr: false,
  validateSearch: (raw: Record<string, unknown>): NewSearch => {
    const out: NewSearch = {};
    const eid = Number(raw.editId);
    if (Number.isFinite(eid) && eid > 0) out.editId = eid;
    const cid = Number(raw.cloneFrom);
    if (Number.isFinite(cid) && cid > 0) out.cloneFrom = cid;
    return out;
  },
  component: NewJackpotPage,
});
