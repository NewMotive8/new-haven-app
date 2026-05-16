import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  LWRuleApi,
  WheelRuleDTO,
} from 'utils/services/api/requests/luckWheel/rule';

interface returnRule {
  rules: Array<WheelRuleDTO> | [];
  isLoading: boolean;
  askRefresh: Function;
  refreshState: number;
  findRule: (id: number) => WheelRuleDTO;
}

export function useRule(): returnRule {
  const [refreshState, setRefreshState] = useState(0);

  const {
    data: rules,
    isLoading,
    refetch,
  } = useQuery('rule', () => LWRuleApi.getAll(), {
    staleTime: 60000,
  });

  function askRefresh() {
    setRefreshState((current) => 1 + current);
    refetch();
  }
  function findRule(id: number) {
    const rule =
      rules?.content.find((rl: WheelRuleDTO) => rl?.id === id) || null;
    return rule;
  }
  return {
    rules: rules?.content || [],
    isLoading,
    askRefresh,
    refreshState,
    findRule,
  };
}
