import { useQuery } from "@tanstack/react-query";
import { AccessResolveAPI } from "../api/access/access";

export function useResolveCase(caseId?: string) {
  return useQuery({
    queryKey: ["resolve-case", caseId],
    queryFn: () => AccessResolveAPI.resolveCase(caseId!),
    enabled: !!caseId,
    retry: false,
  });
}



