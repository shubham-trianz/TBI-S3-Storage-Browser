import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CasesAPI } from '../api/cases/cases.api';
import type { Case, CreateCasePayload, ShareCaseToPayload, ShareExternalPayload } from '../api/cases/cases.types';
import { fetchAuthSession } from 'aws-amplify/auth';

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
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    }
  });
}

export function useShareExternal() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  return useMutation({
    mutationFn: async (payload: ShareExternalPayload) => {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const res = await fetch(`${API_BASE}/share-external`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to share: ${res.status}`);
      }

      return res.json();
    },
  });
}