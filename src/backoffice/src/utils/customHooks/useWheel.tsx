import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  luckWheelApi,
  WheelDTO,
} from 'utils/services/api/requests/luckWheel/wheel';

interface returnRule {
  wheels: Array<WheelDTO> | [];
  isLoading: boolean;
  askRefresh: Function;
  refreshState: number;
  findWheel: (id: number) => WheelDTO;
}

export function useWheel(): returnRule {
  const [refreshState, setRefreshState] = useState(0);

  const {
    data: wheels,
    isLoading,
    refetch,
  } = useQuery('wheels', () => luckWheelApi.getWheels(), {
    staleTime: 60000,
  });

  function askRefresh() {
    setRefreshState((current) => 1 + current);
    refetch();
  }
  function findWheel(id: number) {
    const wheel = wheels?.content.find((wh: WheelDTO) => wh?.id === id) || null;
    return wheel;
  }
  return {
    wheels: wheels?.content || [],
    isLoading,
    askRefresh,
    refreshState,
    findWheel,
  };
}
