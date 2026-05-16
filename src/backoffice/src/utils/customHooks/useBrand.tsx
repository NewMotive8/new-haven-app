import { useState } from 'react';
import { useQuery } from 'react-query';
import brandApi, { brandI } from 'utils/services/api/requests/brand';

interface returnBrand {
  brands: Array<brandI> | [];
  isLoading: boolean;
  askRefresh: Function;
  refreshState: number;
  findBrand: (id: number) => brandI;
}

export function useBrand(): returnBrand {
  const [refreshState, setRefreshState] = useState(0);

  const {
    data: brands,
    isLoading,
    refetch,
  } = useQuery('brands', () => brandApi.getItems(), {
    staleTime: 60000,
  });

  function askRefresh() {
    setRefreshState((current) => 1 + current);
    refetch();
  }
  function findBrand(id: number) {
    const brand = brands?.content.find((bd: brandI) => bd?.id === id) || null;
    return brand;
  }
  return {
    brands: brands?.content || [],
    isLoading,
    askRefresh,
    refreshState,
    findBrand,
  };
}
