import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CasesAPI } from '../api/cases/cases.api';

export function useDeleteEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseNumber,
      objectKeys,
    }: {
      caseNumber: string;
      objectKeys: string[];
    }) => CasesAPI.deleteEvidence(caseNumber, objectKeys),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['evidence', variables.caseNumber],
      });
    },
  });
}
