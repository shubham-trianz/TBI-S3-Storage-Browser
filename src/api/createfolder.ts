import { AxiosResponse } from "axios";
import { apiClient } from "./client";


/**
 * Creates a new folder in S3 under the specified prefix.
 * Used to initialize case directories or subfolders in the storage system.
 */
export const CreateFolderAPI = {
    createFolder(prefix: string): Promise<AxiosResponse> {
        return apiClient.post('/create-folder', { prefix }).then(res => res)
    } 
}



