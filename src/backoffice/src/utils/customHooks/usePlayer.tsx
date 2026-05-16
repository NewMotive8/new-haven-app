import { useState } from 'react';
import { useQuery } from 'react-query';
import playersApi, { playersI } from 'utils/services/api/requests/players';

interface returnRule {
  players: Array<playersI> | [];
  isLoading: boolean;
  askRefresh: Function;
  refreshState: number;
  findPlayer: (id: number) => playersI;
}

export function usePlayer(): returnRule {
  const [refreshState, setRefreshState] = useState(0);

  const {
    data: players,
    isLoading,
    refetch,
  } = useQuery('players', () => playersApi.getItems(), {
    staleTime: 60000,
  });

  function askRefresh() {
    setRefreshState((current) => 1 + current);
    refetch();
  }
  function findPlayer(id: number) {
    const player =
      players?.content.find((bd: playersI) => bd?.id === id) || null;
    return player;
  }
  return {
    players: players?.content || [],
    isLoading,
    askRefresh,
    refreshState,
    findPlayer,
  };
}
