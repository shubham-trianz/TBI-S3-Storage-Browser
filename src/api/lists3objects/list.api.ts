import { apiClient } from "../client";
import { FileType } from "./list.types"

export const ListAPI = {
    listS3Object(prefix: string): Promise<FileType[]> {
        return apiClient.get('/list-s3-objects', {params: {
            prefix: prefix
        }}).then(res => res.data)
    }
}


