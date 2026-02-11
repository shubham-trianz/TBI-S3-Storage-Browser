import { apiClient } from "../client";

export const ListAPI = {
    listS3Object(prefix: string): Promise<void> {
        return apiClient.get('/list-s3-objects', {params: {
            prefix: prefix
        }}).then(res => res.data)
    }
}


