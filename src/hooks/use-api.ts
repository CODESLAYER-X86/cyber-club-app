import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Reusable API query hook with TanStack Query caching.
 * Data stays fresh for 60s (staleTime), cached for 5min (gcTime).
 * Return visits to the same tab/view are instant (no re-fetch).
 */
export function useApi<T>(
  key: string[],
  url: string | null,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const res = await fetch(url!);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'API request failed');
      return data.data;
    },
    enabled: options?.enabled !== false && !!url,
    staleTime: options?.staleTime,
  });
}

/**
 * Reusable API mutation hook for POST/PATCH/DELETE operations.
 * Automatically invalidates specified query keys on success.
 */
export function useApiMutation<TData, TVariables>(
  method: string,
  urlBuilder: (vars: TVariables) => string,
  options?: {
    invalidateKeys?: string[][];
    onSuccess?: (data: TData, vars: TVariables) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (vars) => {
      const res = await fetch(urlBuilder(vars), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Mutation failed');
      return data.data;
    },
    onSuccess: (data, vars) => {
      // Invalidate related queries so they refetch with fresh data
      if (options?.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      options?.onSuccess?.(data, vars);
    },
  });
}
