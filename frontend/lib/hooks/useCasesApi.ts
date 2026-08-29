import { useState, useEffect, useCallback } from 'react';
import { apiClient, APIError } from '../api/client';
import { Case } from '../types';

export interface UseCasesParams {
  status?: string;
  failure_type?: string;
  priority?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedCases {
  items: Case[];
  page: number;
  page_size: number;
  total: number;
}

export function useCasesApi(initialParams: UseCasesParams = {}) {
  const [params, setParams] = useState<UseCasesParams>({ page: 1, page_size: 25, ...initialParams });
  const [data, setData] = useState<PaginatedCases>({ items: [], page: 1, page_size: 25, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const fetchCases = useCallback(async (currentParams: UseCasesParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (currentParams.status) queryParams.append('status', currentParams.status);
      if (currentParams.failure_type) queryParams.append('failure_type', currentParams.failure_type);
      if (currentParams.priority) queryParams.append('priority', currentParams.priority);
      if (currentParams.page) queryParams.append('page', currentParams.page.toString());
      if (currentParams.page_size) queryParams.append('page_size', currentParams.page_size.toString());

      const response = await apiClient.get<PaginatedCases>(`/api/v1/cases?${queryParams.toString()}`);
      setData(response);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err);
      } else {
        setError(new APIError('Failed to fetch cases'));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases(params);
  }, [params, fetchCases]);

  const updateParams = (newParams: Partial<UseCasesParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  };

  const refresh = () => fetchCases(params);

  return { ...data, isLoading, error, updateParams, refresh };
}
