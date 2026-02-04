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

type CreateFolderProps = {
  basePath: string;
  onCreated: () => void;
  disabled?: boolean;
  onDuplicateError?: (message: string, type: 'error' | 'success') => void;
  folderExists?: (folderName: string) => boolean;
  refreshFiles?: () => Promise<void>;
};

export const CreateFolder = ({
  basePath,
  onCreated,
  disabled,
  onDuplicateError,
  folderExists,
  refreshFiles,
}: CreateFolderProps) => {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      // Refresh files from DB BEFORE checking for duplicates
      if (refreshFiles) {
        await refreshFiles();
      }

      // Now check if folder already exists with fresh data
      if (folderExists && folderExists(folderName)) {
        const message = `"${folderName}" already exists. Try with another name?`;
        setError(message);
        onDuplicateError?.(message, 'error');
        setLoading(false);
        return;
      }

      const folderPath = `${basePath}${folderName}/`;

      await uploadData({
        path: folderPath,
        data: new Blob([]),
      }).result;

      onDuplicateError?.(`"${folderName}" created successfully`, 'success');
      setOpen(false);
      onCreated();
    } catch (err) {
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