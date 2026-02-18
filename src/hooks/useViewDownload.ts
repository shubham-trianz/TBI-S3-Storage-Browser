import { useQuery } from "@tanstack/react-query";
import { FileViewDownloadAPI } from "../api/viewdownload";

interface GetSignedUrl {
  url: string; 
}

export function useViewDownload(key: string, mode: 'view' | 'download') {
    return useQuery<GetSignedUrl>({
    queryKey: ['signedurl', key, mode], 
    queryFn: () => FileViewDownloadAPI.getSignedUrl(key, mode),
    enabled: false, 
    staleTime: 60 * 1000, 
  })
}


