import type { JackpotDTO, TopupDTO } from "./types";

// In-memory mock store keyed by brandId. Replace with Lovable Cloud / DB later.
const store = new Map<string, Map<number, JackpotDTO>>();
const idCounters = new Map<string, number>();

function nowIso(): string {
  return new Date().toISOString();
}

function ensureBrand(brandId: string): Map<number, JackpotDTO> {
  let brand = store.get(brandId);
  if (!brand) {
    brand = new Map<number, JackpotDTO>();
    store.set(brandId, brand);
    idCounters.set(brandId, 0);
    seedBrand(brandId, brand);
  }
  return brand;
}

function nextId(brandId: string): number {
  const next = (idCounters.get(brandId) ?? 0) + 1;
  idCounters.set(brandId, next);
  return next;
}

function seedBrand(brandId: string, brand: Map<number, JackpotDTO>): void {
  const seeds: Array<Omit<JackpotDTO, "id" | "brandId" | "createdAt" | "updatedAt">> = [
    {
      name: "Mega Spin",
      enabled: true,
      poolBalance: 12500.5,
      seedAmount: 1000,
      contributionRate: 0.02,
      triggerThreshold: 25000,
    },
    {
      name: "Daily Drop",
      enabled: true,
      poolBalance: 480.75,
      seedAmount: 250,
      contributionRate: 0.015,
      triggerThreshold: 2000,
    },
    {
      name: "Lucky Seven",
      enabled: false,
      poolBalance: 7777,
      seedAmount: 777,
      contributionRate: 0.025,
      triggerThreshold: 77000,
    },
  ];
  for (const s of seeds) {
    const id = nextId(brandId);
    const ts = nowIso();
    brand.set(id, { id, brandId, createdAt: ts, updatedAt: ts, ...s });
  }
}

function matchesFilter(jp: JackpotDTO, filterExp?: string | null): boolean {
  if (!filterExp) return true;
  const eqIdx = filterExp.indexOf("=");
  if (eqIdx === -1) {
    // free-text name match
    return jp.name.toLowerCase().includes(filterExp.toLowerCase());
  }
  const field = filterExp.slice(0, eqIdx).trim();
  const value = filterExp.slice(eqIdx + 1).trim().toLowerCase();
  switch (field) {
    case "name":
      return jp.name.toLowerCase().includes(value);
    case "enabled":
      return String(jp.enabled) === value;
    case "id":
      return String(jp.id) === value;
    default:
      return true;
  }
}

export function listJackpots(brandId: string, filterExp?: string | null): JackpotDTO[] {
  const brand = ensureBrand(brandId);
  return Array.from(brand.values()).filter((j) => matchesFilter(j, filterExp));
}

export function getJackpot(brandId: string, id: number): JackpotDTO | undefined {
  return ensureBrand(brandId).get(id);
}

export function createJackpot(brandId: string, dto: Partial<JackpotDTO>): JackpotDTO {
  const brand = ensureBrand(brandId);
  const id = nextId(brandId);
  const ts = nowIso();
  const jp: JackpotDTO = {
    id,
    brandId,
    name: dto.name ?? `Jackpot ${id}`,
    enabled: dto.enabled ?? true,
    poolBalance: Number(dto.poolBalance ?? dto.seedAmount ?? 0),
    seedAmount: Number(dto.seedAmount ?? 0),
    contributionRate: Number(dto.contributionRate ?? 0.01),
    triggerThreshold: Number(dto.triggerThreshold ?? 1000),
    createdAt: ts,
    updatedAt: ts,
  };
  brand.set(id, jp);
  return jp;
}

export function updateJackpot(
  brandId: string,
  id: number,
  dto: Partial<JackpotDTO>,
): JackpotDTO | undefined {
  const brand = ensureBrand(brandId);
  const existing = brand.get(id);
  if (!existing) return undefined;
  const updated: JackpotDTO = {
    ...existing,
    ...dto,
    id: existing.id,
    brandId: existing.brandId,
    createdAt: existing.createdAt,
    updatedAt: nowIso(),
  };
  brand.set(id, updated);
  return updated;
}

export function deleteJackpot(brandId: string, id: number): boolean {
  return ensureBrand(brandId).delete(id);
}

export function setEnabled(
  brandId: string,
  id: number,
  enabled: boolean,
): JackpotDTO | undefined {
  return updateJackpot(brandId, id, { enabled });
}

export function applyTopup(brandId: string, dto: TopupDTO): JackpotDTO | undefined {
  const existing = getJackpot(brandId, dto.jackpotId);
  if (!existing) return undefined;
  const amount = Number(dto.amount) || 0;
  return updateJackpot(brandId, dto.jackpotId, {
    poolBalance: existing.poolBalance + amount,
    seedAmount: dto.isSeed ? existing.seedAmount + amount : existing.seedAmount,
  });
}
