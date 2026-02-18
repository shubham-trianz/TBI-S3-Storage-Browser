import { uploadData } from "aws-amplify/storage";
import { Button } from "@aws-amplify/ui-react";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import { CreateFolderAPI } from "../../api/createfolder";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

type CreateFolderProps = {
  basePath: string;
  onCreated: () => void;
  disabled?: boolean;
  onDuplicateError?: (message: string, type: 'error' | 'success') => void;
  folderExists?: (folderName: string) => boolean;
  refreshFiles?: () => Promise<void>;
  receivedTab?: boolean
};

export const CreateFolder = ({
  basePath,
  onCreated,
  disabled,
  onDuplicateError,
  folderExists,
  refreshFiles,
  receivedTab,
}: CreateFolderProps) => {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const handleOpen = () => {
    setFolderName("");
    setError(null);
    setOpen(true);
  };

  const handleCreateFolder = async () => {
    setError(null);

    if (!folderName) {
      setError("Folder name is required");
      return;
    }

    if (folderName.includes("/")) {
      setError("Folder name cannot contain '/'");
      return;
    }

    try {
      setLoading(true);

      if (refreshFiles) {
        await refreshFiles();
      }



      if (folderExists && folderExists(folderName)) {
        const message = `"${folderName}" already exists. Try with another name?`;
        setError(message);
        onDuplicateError?.(message, 'error');
        setLoading(false);
        return;
      }

      const folderPath = `${basePath}${folderName}/`;
      if(receivedTab){
        const result =  await CreateFolderAPI.createFolder(folderPath)
        if(result.status == 200){
          

        queryClient.invalidateQueries({
            queryKey: ["files"],
        });
        toast.success(`${result.data}`)
        }
      }else{
        await uploadData({
        path: folderPath,
        data: new Blob([]),
      }).result;
      }
      

      onDuplicateError?.(`"${folderName}" created successfully`, 'success');
      setOpen(false)
      onCreated();
    } catch (err: any) {
      if (err.status === 401) {
        toast.error('Access Denied')
        setOpen(false);
      }
      console.error("Error creating folder", err);
      setError("Failed to create folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        onClick={handleOpen}
        isDisabled={disabled}
      >
        New Folder
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            helperText={error ?? "Folder name cannot contain '/'"}
            error={!!error}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button variation="link" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variation="primary"
            onClick={handleCreateFolder}
            isDisabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};