import { useQuery } from '@tanstack/react-query';
import { CasesAPI } from '../api/cases/cases.api';
import type { EvidenceListResponse } from '../api/cases/cases.types';

export function useCaseEvidence(caseNumber: string) {
  return useQuery<EvidenceListResponse>({
    queryKey: ['evidence', caseNumber],
    queryFn: () => CasesAPI.getCaseEvidence(caseNumber),
    enabled: !!caseNumber,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}
