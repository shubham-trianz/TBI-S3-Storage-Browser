import { useQuery } from "@tanstack/react-query";
import { ListAPI } from "../api/lists3objects/list.api";

export function useListS3Objects(prefix: string) {
  return useQuery({
    queryKey: ['objects', prefix],
    queryFn: () => ListAPI.listS3Object(prefix),
    enabled: !!prefix,
  });
}

