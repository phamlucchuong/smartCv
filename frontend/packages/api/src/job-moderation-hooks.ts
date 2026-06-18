import { useMutation, useQuery } from '@tanstack/react-query';
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { customInstance } from './axios-instance';
import type { ApiResponseJobResponse, ApiResponsePageResponseJobResponse } from './generated/job/model';

export type AdminJobsParams = {
  moderationStatus?: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  page?: number;
  size?: number;
};

export const getAdminJobs = (
  params?: AdminJobsParams,
  options?: object,
): Promise<ApiResponsePageResponseJobResponse> =>
  customInstance(
    {
      url: '/api/jobs/admin/all',
      method: 'GET',
      params,
    },
    options,
  );

export const getGetAdminJobsQueryKey = (params?: AdminJobsParams) =>
  ['/api/jobs/admin/all', ...(params ? [params] : [])] as const;

export const useGetAdminJobs = <TData = Awaited<ReturnType<typeof getAdminJobs>>, TError = unknown>(
  params?: AdminJobsParams,
  options?: { query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getAdminJobs>>, TError, TData>> },
) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetAdminJobsQueryKey(params);

  return useQuery<Awaited<ReturnType<typeof getAdminJobs>>, TError, TData>({
    queryKey,
    queryFn: () => getAdminJobs(params),
    ...queryOptions,
  });
};

export interface JobRejectRequest {
  note: string;
}

export const submitJob = (id: string, options?: object): Promise<ApiResponseJobResponse> =>
  customInstance(
    {
      url: `/api/jobs/${id}/submit`,
      method: 'PATCH',
    },
    options,
  );

export const withdrawJob = (id: string, options?: object): Promise<ApiResponseJobResponse> =>
  customInstance(
    {
      url: `/api/jobs/${id}/withdraw`,
      method: 'PATCH',
    },
    options,
  );

export const activateJob = (id: string, options?: object): Promise<ApiResponseJobResponse> =>
  customInstance(
    {
      url: `/api/jobs/${id}/activate`,
      method: 'PATCH',
    },
    options,
  );

export const deactivateJob = (id: string, options?: object): Promise<ApiResponseJobResponse> =>
  customInstance(
    {
      url: `/api/jobs/${id}/deactivate`,
      method: 'PATCH',
    },
    options,
  );

export const approveJob = (id: string, options?: object): Promise<ApiResponseJobResponse> =>
  customInstance(
    {
      url: `/api/jobs/admin/${id}/approve`,
      method: 'PATCH',
    },
    options,
  );

export const rejectJob = (
  id: string,
  request: JobRejectRequest,
  options?: object,
): Promise<ApiResponseJobResponse> =>
  customInstance(
    {
      url: `/api/jobs/admin/${id}/reject`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: request,
    },
    options,
  );

function createIdMutationHook<
  TFn extends (id: string, options?: object) => Promise<ApiResponseJobResponse>,
>(
  fn: TFn,
) {
  return <TError = unknown, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<TFn>>,
      TError,
      { id: string },
      TContext
    >;
  }) =>
    useMutation<Awaited<ReturnType<TFn>>, TError, { id: string }, TContext>({
      mutationFn: ({ id }) => fn(id) as Promise<Awaited<ReturnType<TFn>>>,
      ...(options?.mutation ?? {}),
    });
}

export const useSubmitJob = createIdMutationHook(submitJob);
export const useWithdrawJob = createIdMutationHook(withdrawJob);
export const useActivateJob = createIdMutationHook(activateJob);
export const useDeactivateJob = createIdMutationHook(deactivateJob);
export const useApproveJob = createIdMutationHook(approveJob);

export const useRejectJob = <TError = unknown, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof rejectJob>>,
    TError,
    { id: string; data: JobRejectRequest },
    TContext
  >;
}) =>
  useMutation<
    Awaited<ReturnType<typeof rejectJob>>,
    TError,
    { id: string; data: JobRejectRequest },
    TContext
  >({
    mutationFn: ({ id, data }) => rejectJob(id, data),
    ...(options?.mutation ?? {}),
  });
