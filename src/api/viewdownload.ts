import { apiClient } from "./client";

export const FileViewDownloadAPI = {
    getSignedUrl(key: string, mode: 'view' | 'download') {
    return apiClient
      .post('/signedUrl', { key, mode })
      .then(res => res.data.url);
  }
}

