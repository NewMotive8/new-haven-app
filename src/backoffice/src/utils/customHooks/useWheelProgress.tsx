import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  LWRuleProgressApi,
  RuleProgressDTO,
} from 'utils/services/api/requests/luckWheel/ruleProgress';

interface returnWheelProgress {
  wheelProgress: Array<RuleProgressDTO> | [];
  isLoading: boolean;
  askRefresh: Function;
  refreshState: number;
  findWheelProgress: (id: number) => RuleProgressDTO;
}

export function useWheelProgress(): returnWheelProgress {
  const [refreshState, setRefreshState] = useState(0);

  const {
    data: wheelProgress,
    isLoading,
    refetch,
  } = useQuery('wheel-progress', () => LWRuleProgressApi.getAll(), {
    staleTime: 60000,
  });

  function askRefresh() {
    setRefreshState((current) => 1 + current);
    refetch();
  }
  function findWheelProgress(id: number) {
    const wheelProgres =
      wheelProgress?.content.find((wp: RuleProgressDTO) => wp?.id === id) ||
      null;
    return wheelProgres;
  }
  return {
    wheelProgress: wheelProgress?.content || [],
    isLoading,
    askRefresh,
    refreshState,
    findWheelProgress,
  };
}
