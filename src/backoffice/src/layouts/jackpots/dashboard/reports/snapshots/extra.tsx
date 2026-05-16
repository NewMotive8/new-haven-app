type SourcePool = {
  id: number;
  amountPaid: number;
  amountContributed: number;
  currentAmount: number;
  lastPoolTransactionTimestamp: string;
  lastSeedTransactionTimestamp: string | null;
  seedId: number | null;
  numberOfWins: number;
  numberOfSpins: number;
};

type SourceJackpot = {
  jackpotId: number;
  pools: SourcePool[];
};

type SourceStatistics = {
  jackpots: SourceJackpot[];
  totalEvents: number;
  maximumEvents: number;
};

type SourceObject = {
  id: number;
  brandId: number;
  statistics: SourceStatistics;
  createdDate: string;
  lastModifiedDate: string;
};

type DestinationPool = {
  id: number;
  amountPaid: number;
  amountContributed: number;
  currentAmount: number;
  lastPoolTransactionTimestamp: string;
  lastSeedTransactionTimestamp: string | null;
  seedId: number | null;
  numberOfWins: number;
  numberOfSpins: number;
};

type DestinationJackpot = {
  jackpotId: number;
  pools: DestinationPool[];
};

type DestinationStatistics = {
  jackpots: DestinationJackpot[];
  totalEvents: number;
  maximumEvents: number;
};

type DestinationObject = {
  id: number;
  brandId: number;
  statistics: DestinationStatistics;
  createdDate: string;
  lastModifiedDate: string;
};
export const convertObject = (source: SourceObject): DestinationObject => {
  return {
    ...source,
    statistics: {
      ...source.statistics,
      jackpots: source.statistics.jackpots.map((jackpot) => ({
        ...jackpot,
        pools: jackpot.pools.map((pool) => ({
          ...pool,
        })),
      })),
    },
  }
}
