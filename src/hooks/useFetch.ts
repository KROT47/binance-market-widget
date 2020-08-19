import { useState, useEffect, useCallback } from "react";

type StateType<DataType> = {
  refetch: () => void;
  data: DataType;
  loading: boolean;
  error: string | null;
};

export const useFetch = <DataType>(
  fetchData: () => Promise<DataType>,
  defaultData: DataType = null
): StateType<DataType> => {
  const refetch = useCallback(() => {
    fetchData()
      .then((data) => {
        console.log(">>>data", data);
        setState((state) => ({
          ...state,
          data,
          loading: false,
          error: null,
        }));
      })
      .catch((error) => {
        console.log(">>>error", error);
        setState((state) => ({
          ...state,
          data: defaultData,
          loading: false,
          error,
        }));
      });
  }, [fetchData, defaultData]);

  const [state, setState] = useState({
    refetch,
    data: defaultData,
    loading: true,
    error: null,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => refetch(), []);

  return state;
};
