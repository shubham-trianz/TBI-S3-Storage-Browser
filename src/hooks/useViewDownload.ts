import { useQuery } from "@tanstack/react-query";
import { FileViewDownloadAPI } from "../api/viewdownload";

interface GetSignedUrl {
  url: string; // signed URL from backend
}

export function useViewDownload(key: string, mode: 'view' | 'download') {
    return useQuery<GetSignedUrl>({
    queryKey: ['signedurl', key, mode], // unique query key per file + mode
    queryFn: () => FileViewDownloadAPI.getSignedUrl(key, mode),
    enabled: false, // only run if key exists
    staleTime: 60 * 1000, // cache for 1 min
  })
}


