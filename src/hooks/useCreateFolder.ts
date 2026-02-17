import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateFolderAPI } from "../api/createfolder";
export function useCreateFolder(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: CreateFolderAPI.createFolder,
        onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: ["files"],
        });
    },
    })
}