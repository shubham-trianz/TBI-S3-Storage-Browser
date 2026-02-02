import { remove } from "aws-amplify/storage";
import { Button, Flex } from "@aws-amplify/ui-react";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";

type DeleteObjectsProps = {
  selectedPaths: string[];
  onDeleted: () => void;
  disabled?: boolean;
};

export const DeleteObjects = ({
  selectedPaths,
  onDeleted,
  disabled,
}: DeleteObjectsProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeleteClick = () => {
    if (selectedPaths.length === 0) return;
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    setConfirmOpen(false);
    try {
      await Promise.all(selectedPaths.map((path) => remove({ path })));
      onDeleted();
    } catch (err) {
      console.error("Error deleting objects", err);
      setErrorMsg("Failed to delete one or more items");
      setErrorOpen(true);
    }
  };

  return (
    <>
      <Flex>
        <Button
          size="small"
          variation="destructive"
          isDisabled={disabled || selectedPaths.length === 0}
          onClick={handleDeleteClick}
        >
          Delete
        </Button>
      </Flex>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm delete</DialogTitle>
        <DialogContent>
          <Typography>
            Delete {selectedPaths.length} item(s)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variation="link" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variation="destructive" onClick={performDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorOpen} onClose={() => setErrorOpen(false)}>
        <DialogTitle>Delete failed</DialogTitle>
        <DialogContent>
          <Typography>{errorMsg}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variation="primary" onClick={() => setErrorOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};