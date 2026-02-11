import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CasesAPI } from '../api/cases/cases.api';
import type { Case, CreateCasePayload, ShareCaseToPayload } from '../api/cases/cases.types';

export function useCases() {
  return useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: CasesAPI.getAll,
  });
}


export function useReceivedCases(userId: string) {
  return useQuery({
    queryKey: ['received-cases'],
    queryFn: () => CasesAPI.getReceivedCaseByUser(userId),
    // enabled: !!userId,
  });
}

export function useCreateCase() {
    const queryClient = useQueryClient();
    return useMutation<Case, Error, CreateCasePayload>({
        mutationFn: CasesAPI.createCase,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] })
        }
    })
}

export function useShareCaseTo() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ShareCaseToPayload[]>({
    mutationFn: CasesAPI.shareCaseTo,

    onSuccess: () => {
      // Cases list (owner view might show "shared by me" badge)
      queryClient.invalidateQueries({ queryKey: ['cases'] });

      // If you later add "sharedCases" query
      // queryClient.invalidateQueries({ queryKey: ['sharedCases'] });
    }
  });
}
