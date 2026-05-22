-- Master category enum-as-CHECK
CREATE TABLE IF NOT EXISTS public.games (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  master_category text NOT NULL,
  provider text NOT NULL,
  operator_game_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT games_master_category_check CHECK (master_category IN
    ('Slots','Table Games','Live Casino','Crash Games','Sports'))
);

CREATE UNIQUE INDEX IF NOT EXISTS games_provider_operator_uniq
  ON public.games (provider, operator_game_id);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS games_name_trgm_idx
  ON public.games USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS games_master_category_idx
  ON public.games (master_category);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage games"
  ON public.games
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER games_set_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Assignment columns on jackpots + jackpot_groups
ALTER TABLE public.jackpots
  ADD COLUMN IF NOT EXISTS assigned_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assigned_game_ids   bigint[] NOT NULL DEFAULT '{}';

ALTER TABLE public.jackpot_groups
  ADD COLUMN IF NOT EXISTS assigned_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assigned_game_ids   bigint[] NOT NULL DEFAULT '{}';

ALTER TABLE public.jackpots
  ADD CONSTRAINT jackpots_assigned_categories_check
  CHECK (assigned_categories <@ ARRAY['Slots','Table Games','Live Casino','Crash Games','Sports']::text[]);

ALTER TABLE public.jackpot_groups
  ADD CONSTRAINT jackpot_groups_assigned_categories_check
  CHECK (assigned_categories <@ ARRAY['Slots','Table Games','Live Casino','Crash Games','Sports']::text[]);

-- Seed ~25 sample games
INSERT INTO public.games (name, master_category, provider, operator_game_id) VALUES
  ('Starburst',              'Slots',       'NetEnt',       'netent-starburst'),
  ('Gonzo''s Quest',         'Slots',       'NetEnt',       'netent-gonzos-quest'),
  ('Book of Dead',           'Slots',       'Play''n GO',   'pgo-book-of-dead'),
  ('Mega Moolah',            'Slots',       'Microgaming',  'mg-mega-moolah'),
  ('Sweet Bonanza',          'Slots',       'Pragmatic',    'pp-sweet-bonanza'),
  ('Gates of Olympus',       'Slots',       'Pragmatic',    'pp-gates-of-olympus'),
  ('Big Bass Bonanza',       'Slots',       'Pragmatic',    'pp-big-bass-bonanza'),
  ('Reactoonz',              'Slots',       'Play''n GO',   'pgo-reactoonz'),
  ('European Roulette',      'Table Games', 'NetEnt',       'netent-euro-roulette'),
  ('Classic Blackjack',      'Table Games', 'Microgaming',  'mg-classic-blackjack'),
  ('Baccarat Pro',           'Table Games', 'NetEnt',       'netent-baccarat-pro'),
  ('Casino Hold''em',        'Table Games', 'Evolution',    'evo-casino-holdem'),
  ('Lightning Roulette',     'Live Casino', 'Evolution',    'evo-lightning-roulette'),
  ('Crazy Time',             'Live Casino', 'Evolution',    'evo-crazy-time'),
  ('Monopoly Live',          'Live Casino', 'Evolution',    'evo-monopoly-live'),
  ('Dream Catcher',          'Live Casino', 'Evolution',    'evo-dream-catcher'),
  ('Live Blackjack VIP',     'Live Casino', 'Pragmatic',    'pp-live-bj-vip'),
  ('Aviator',                'Crash Games', 'Spribe',       'sp-aviator'),
  ('JetX',                   'Crash Games', 'SmartSoft',    'ss-jetx'),
  ('Spaceman',               'Crash Games', 'Pragmatic',    'pp-spaceman'),
  ('Cash Show',              'Crash Games', 'BGaming',      'bg-cash-show'),
  ('Football: Champions',    'Sports',      'Kambi',        'kambi-football-champions'),
  ('Tennis: Grand Slam',     'Sports',      'Kambi',        'kambi-tennis-gs'),
  ('Basketball: NBA Live',   'Sports',      'SBTech',       'sbt-nba-live'),
  ('Horse Racing Classic',   'Sports',      'BetRadar',     'br-horse-classic')
ON CONFLICT (provider, operator_game_id) DO NOTHING;