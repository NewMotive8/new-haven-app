import Card from 'components/cards/card';
import { createContext, useState } from 'react';
import { useQuery } from 'react-query';
import {
  LWRuleApi,
  WheelRuleDTO,
} from 'utils/services/api/requests/luckWheel/rule';
import LWSetupForm from './form';
import LWSetupHeader from './header';
import ListCrud from './list';

export interface LWRulesContextI {
  selectedItem: WheelRuleDTO;
  setSelectedItem: Function;
  submitForm: Function;
  deleteItem: Function;
  loading: boolean;
  listRules: Array<WheelRuleDTO> | [];
  askRefresh: Function;
  refreshState?: number;
}

export const LWRulesContext = createContext<LWRulesContextI>({
  selectedItem: null as any,
  setSelectedItem: () => {},
  submitForm: () => {},
  deleteItem: () => {},
  loading: false,
  listRules: [],
  askRefresh: () => {},
  refreshState: 0,
});

export default function LWWheelRulesLayout() {
  const [selectedItem, setSelectedItem] = useState<WheelRuleDTO | null>(null);
  const [refreshState, setRefreshState] = useState(0);

  const {
    data: listRules,
    refetch,
    isLoading: loading,
  } = useQuery('lw-rules', () => LWRuleApi.getAll(), {
    staleTime: 6000,
    select: (data) => {
      return data.content;
    },
  });

  function askRefresh() {
    setRefreshState((current) => 1 + current);
    refetch();
  }
  function deleteItem() {
    LWRuleApi.deleteItem({
      id: selectedItem?.id as number,
      successCallBack: () => {
        askRefresh();
        setSelectedItem(null);
      },
      errorCallBack: () => {},
    });
  }
  function submitForm() {
    LWRuleApi.submitForm(selectedItem as WheelRuleDTO, {
      successCallBack: (responseItem: any) => {
        setSelectedItem(responseItem);
        askRefresh();
      },
    });
  }

  return (
    <LWRulesContext.Provider
      value={{
        selectedItem: selectedItem as WheelRuleDTO,
        setSelectedItem,
        submitForm,
        deleteItem,
        loading,
        listRules,
        askRefresh,
        refreshState,
      }}
    >
      <Card color='secondary'>
        <LWSetupHeader />
        {selectedItem ? <LWSetupForm /> : <ListCrud />}
      </Card>
    </LWRulesContext.Provider>
  );
}
