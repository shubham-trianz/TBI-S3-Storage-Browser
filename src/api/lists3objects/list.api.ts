import toast from "react-hot-toast";
import { apiClient } from "../client";
import { FileType } from "./list.types"

export const ListAPI = {
    // List S3 objects under the specified prefix
    listS3Object(prefix: string): Promise<FileType[]> {
        return apiClient.get('/list-s3-objects', {params: {
            prefix: prefix
        }}).then(res => res.data).catch((err) => {
            toast.error(err.message)
            throw err;
        })
    }
}


