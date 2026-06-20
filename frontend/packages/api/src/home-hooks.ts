import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { customInstance } from './axios-instance';
import type { ApiResponseListJobResponse } from './generated/job/model';

export const getHotJobs = (options?: object): Promise<ApiResponseListJobResponse> =>
  customInstance({ url: '/api/home/hot-jobs', method: 'GET' }, options);

export const getGetHotJobsQueryKey = () => ['/api/home/hot-jobs'] as const;

export const useGetHotJobs = <TData = Awaited<ReturnType<typeof getHotJobs>>, TError = unknown>(
  queryOptions?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getHotJobs>>, TError, TData>>,
) => {
  const queryKey = queryOptions?.queryKey ?? getGetHotJobsQueryKey();
  return useQuery<Awaited<ReturnType<typeof getHotJobs>>, TError, TData>({
    queryKey,
    queryFn: () => getHotJobs(),
    ...queryOptions,
  });
};
