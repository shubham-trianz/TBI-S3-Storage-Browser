import { AxiosResponse } from "axios";
import { apiClient } from "./client";


export const CreateFolderAPI = {
    createFolder(prefix: string): Promise<AxiosResponse> {
        return apiClient.post('/create-folder', { prefix }).then(res => res)
    } 
}



