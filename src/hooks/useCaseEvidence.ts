import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CasesAPI } from '../api/cases/cases.api';
import type { EvidenceListResponse, EvidenceCreatePayload} from '../api/cases/cases.types';

export function useCaseEvidence(caseNumber: string) {
  return useQuery<EvidenceListResponse>({
    queryKey: ['evidence', caseNumber],
    queryFn: () => CasesAPI.getCaseEvidence(caseNumber),
    enabled: !!caseNumber,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

export function useCreateEvidence(caseNumber: string){
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EvidenceCreatePayload) =>
      CasesAPI.createEvidence(caseNumber,payload),
    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey: ['evidence',caseNumber]})
    }
  })
}