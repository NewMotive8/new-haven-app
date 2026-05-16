import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  LWRuleInstanceApi,
  WheelRuleInstanceDTO,
} from 'utils/services/api/requests/luckWheel/ruleInstace';

interface returnWheelInstance {
  wheelsInstances: Array<WheelRuleInstanceDTO> | [];
  isLoading: boolean;
  askRefresh: Function;
  refreshState: number;
  findWheelsInstances: (id: number) => WheelRuleInstanceDTO;
}

export function useWheelInstance(): returnWheelInstance {
  const [refreshState, setRefreshState] = useState(0);

  const {
    data: wheelsInstances,
    isLoading,
    refetch,
  } = useQuery('wheel-instance', () => LWRuleInstanceApi.getAll(), {
    staleTime: 60000,
  });

  function askRefresh() {
    setRefreshState((current) => 1 + current);
    refetch();
  }
  function findWheelsInstances(id: number) {
    const wheelInstance =
      wheelsInstances?.content.find(
        (wi: WheelRuleInstanceDTO) => wi?.id === id
      ) || null;
    return wheelInstance;
  }
  return {
    wheelsInstances: wheelsInstances?.content || [],
    isLoading,
    askRefresh,
    refreshState,
    findWheelsInstances,
  };
}
