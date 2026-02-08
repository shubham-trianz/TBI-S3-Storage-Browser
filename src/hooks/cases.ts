import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CasesAPI } from '../api/cases/cases.api';
import type { Case, CreateCasePayload } from '../api/cases/cases.types';

export function useCases() {
  return useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: CasesAPI.getAll,
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
