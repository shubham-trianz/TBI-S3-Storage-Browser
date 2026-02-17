import { useQuery } from "@tanstack/react-query";
import { ListAPI } from "../api/lists3objects/list.api";

export function useListS3Objects(prefix: string | null) {
  return useQuery({
    queryKey: ['files'],
    queryFn: () => ListAPI.listS3Object(prefix!),
    enabled: !!prefix,
  });
}

