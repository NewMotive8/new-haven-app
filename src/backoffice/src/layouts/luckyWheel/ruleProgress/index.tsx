import Card from 'components/cards/card';
import { createContext, useState } from 'react';
import { useQuery } from 'react-query';
import {
  LWRuleProgressApi,
  RuleProgressDTO,
} from 'utils/services/api/requests/luckWheel/ruleProgress';
import LWSetupForm from './form';
import LWSetupHeader from './header';
import ListCrud from './list';

export interface LWRuleProgressContextI {
  selectedItem: RuleProgressDTO;
  setSelectedItem: Function;
  submitForm: Function;
  deleteItem: Function;
  loading: boolean;
  listRuleProgress: Array<RuleProgressDTO> | [];
  askRefresh: Function;
  refreshState?: number;
}

export const LWRuleProgressContext = createContext<LWRuleProgressContextI>({
  selectedItem: null as any,
  setSelectedItem: () => {},
  submitForm: () => {},
  deleteItem: () => {},
  loading: false,
  listRuleProgress: [],
  askRefresh: () => {},
  refreshState: 0,
});

export default function LWRuleProgressLayout() {
  const [selectedItem, setSelectedItem] = useState<RuleProgressDTO | null>(
    null
  );
  const [refreshState, setRefreshState] = useState(0);

  const {
    data: listRuleProgress,
    refetch,
    isLoading: loading,
  } = useQuery('lw-rule-progress', () => LWRuleProgressApi.getAll(), {
    staleTime: 6000,
    select: (data) => {
      return data.content;
    },
  });
  function askRefresh() {
    setRefreshState((current) => 1 + current);
    refetch();
  }
  function deleteItem(id: number) {
    LWRuleProgressApi.deleteItem({
      id: id as number,
      successCallBack: () => {
        askRefresh();
        setSelectedItem(null);
      },
      errorCallBack: () => {},
    });
  }
  function submitForm() {
    LWRuleProgressApi.submitForm(selectedItem as RuleProgressDTO, {
      successCallBack: (responseItem: any) => {
        setSelectedItem(responseItem);
        askRefresh();
      },
    });
  }
  return (
    <LWRuleProgressContext.Provider
      value={{
        selectedItem: selectedItem as RuleProgressDTO,
        setSelectedItem,
        submitForm,
        deleteItem,
        loading,
        listRuleProgress,
        askRefresh,
        refreshState,
      }}
    >
      <Card color='secondary'>
        <LWSetupHeader />
        {selectedItem ? <LWSetupForm /> : <ListCrud />}
      </Card>
    </LWRuleProgressContext.Provider>
  );
}
