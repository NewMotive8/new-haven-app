
CREATE TABLE public.jackpots (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id BIGINT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  contribution_percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
  volatility DOUBLE PRECISION NOT NULL DEFAULT 0,
  trigger_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX jackpots_brand_id_idx ON public.jackpots(brand_id);

CREATE TABLE public.jackpot_pools (
  id BIGSERIAL PRIMARY KEY,
  jackpot_id BIGINT NOT NULL REFERENCES public.jackpots(id) ON DELETE CASCADE,
  current_balance DOUBLE PRECISION NOT NULL DEFAULT 0
);
CREATE INDEX jackpot_pools_jackpot_id_idx ON public.jackpot_pools(jackpot_id);

CREATE TABLE public.jackpot_seeds (
  id BIGSERIAL PRIMARY KEY,
  jackpot_id BIGINT NOT NULL REFERENCES public.jackpots(id) ON DELETE CASCADE,
  base_seed_amount DOUBLE PRECISION NOT NULL DEFAULT 0
);
CREATE INDEX jackpot_seeds_jackpot_id_idx ON public.jackpot_seeds(jackpot_id);

ALTER TABLE public.jackpots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpot_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpot_seeds ENABLE ROW LEVEL SECURITY;

-- No public policies: only the service role (server admin) may read/write.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jackpots_set_updated_at
BEFORE UPDATE ON public.jackpots
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
