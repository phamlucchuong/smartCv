import { useQuery, useMutation } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { customInstance } from './axios-instance';

// Submit attempt with optional overtime flag (query param)
export const useSubmitAttemptWithFlag = <TError = unknown, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, { attemptId: string; overtime?: boolean }, TContext> },
) => {
  const { mutation: mutationOptions } = options ?? {};
  return useMutation<void, TError, { attemptId: string; overtime?: boolean }, TContext>({
    mutationFn: ({ attemptId, overtime = false }) =>
      customInstance({
        url: `/api/attempts/${attemptId}/submit`,
        method: 'POST',
        params: overtime ? { overtime: 'true' } : undefined,
      }),
    ...mutationOptions,
  });
};

export interface AttemptSummaryItem {
  attemptId?: string;
  assessmentId?: string;
  candidateId?: string;
  status?: string;
  score?: number;
  result?: string;
  submittedAt?: string;
}

export interface ApiResponseAttemptSummaryList {
  code?: number;
  message?: string;
  data?: AttemptSummaryItem[];
}

export const useGetAttemptsByAssessment = <TError = unknown>(
  assessmentId: string,
  options?: { query?: Partial<UseQueryOptions<ApiResponseAttemptSummaryList, TError>> },
) => {
  const { query: queryOptions } = options ?? {};
  return useQuery<ApiResponseAttemptSummaryList, TError>({
    queryKey: [`/api/assessments/${assessmentId}/attempts`],
    queryFn: () => customInstance({ url: `/api/assessments/${assessmentId}/attempts`, method: 'GET' }),
    enabled: !!assessmentId,
    ...queryOptions,
  });
};

export const usePublishAssessment = <TError = unknown, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, { id: string }, TContext> },
) => {
  const { mutation: mutationOptions } = options ?? {};
  return useMutation<void, TError, { id: string }, TContext>({
    mutationFn: ({ id }) => customInstance({ url: `/api/assessments/${id}/publish`, method: 'PATCH' }),
    ...mutationOptions,
  });
};
