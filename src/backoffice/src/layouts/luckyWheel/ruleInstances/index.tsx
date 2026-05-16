import Card from 'components/cards/card';
import { createContext, useState } from 'react';
import { useQuery } from 'react-query';
import {
  LWRuleInstanceApi,
  WheelRuleInstanceDTO,
} from 'utils/services/api/requests/luckWheel/ruleInstace';
import LWSetupForm from './form';
import LWSetupHeader from './header';
import ListCrud from './list';

export interface LWRuleInstancesContextI {
  selectedItem: WheelRuleInstanceDTO;
  setSelectedItem: Function;
  submitForm: Function;
  deleteItem: Function;
  loading: boolean;
  listRuleInstance: Array<WheelRuleInstanceDTO> | [];
  askRefresh: Function;
  refreshState?: number;
}

export const LWRuleInstancesContext = createContext<LWRuleInstancesContextI>({
  selectedItem: null as any,
  setSelectedItem: () => {},
  submitForm: () => {},
  deleteItem: () => {},
  loading: false,
  listRuleInstance: [],
  askRefresh: () => {},
  refreshState: 0,
});

export default function LWRuleInstancesLayout() {
  const [selectedItem, setSelectedItem] = useState<WheelRuleInstanceDTO | null>(
    null
  );
  const [refreshState, setRefreshState] = useState(0);

  const {
    data: listRuleInstance,
    refetch,
    isLoading: loading,
  } = useQuery('lw-rule-instances', () => LWRuleInstanceApi.getAll(), {
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
    LWRuleInstanceApi.deleteItem({
      id: selectedItem?.id as number,
      successCallBack: () => {
        askRefresh();
        setSelectedItem(null);
      },
      errorCallBack: () => {},
    });
  }

  function submitForm() {
    LWRuleInstanceApi.submitForm(selectedItem as WheelRuleInstanceDTO, {
      successCallBack: (responseItem: any) => {
        setSelectedItem(responseItem);
        askRefresh();
      },
    });
  }
  return (
    <LWRuleInstancesContext.Provider
      value={{
        selectedItem: selectedItem as WheelRuleInstanceDTO,
        setSelectedItem,
        submitForm,
        deleteItem,
        loading,
        listRuleInstance,
        askRefresh,
        refreshState,
      }}
    >
      <Card color='secondary'>
        <LWSetupHeader />
        {selectedItem ? <LWSetupForm /> : <ListCrud />}
      </Card>
    </LWRuleInstancesContext.Provider>
  );
}
