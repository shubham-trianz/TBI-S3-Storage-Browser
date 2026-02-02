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
};

export const CreateFolder = ({
  basePath,
  onCreated,
  disabled,
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

    const folderPath = `${basePath}${folderName}/`;

    try {
      setLoading(true);
      // Create empty object to represent folder
      await uploadData({
        path: folderPath,
        data: new Blob([]),
      }).result;

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
        variation="secondary"
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