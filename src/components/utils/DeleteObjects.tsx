import { remove, list } from "aws-amplify/storage";
import { Button, Flex } from "@aws-amplify/ui-react";
import {  useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { fetchAuthSession } from "aws-amplify/auth";
import { useUser } from "../../context/UserContext";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteEvidence } from "../../hooks/useDeleteEvidence";

type DeleteObjectsProps = {
  selectedPaths: string[];
  currentCaseNumber?: string | null; // NEW
  onDeleted: () => void;
  disabled?: boolean;
};

export const DeleteObjects = ({
  selectedPaths,
  currentCaseNumber,
  onDeleted,
  disabled,
}: DeleteObjectsProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user_name } = useUser();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteEvidence } = useDeleteEvidence();
  const deleteCase = async (paths: string[]) => {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const payload = {
      user_name,
      selectedPaths: paths,
    };

    const res = await fetch(`${apiBaseUrl}/cases`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Case delete failed: ${res.status}`);
    }

    return await res.json();
  };

  const handleDeleteClick = async () => {
    if (selectedPaths.length === 0) return;
    setConfirmOpen(true);
  };

  const isFolderWithObjects = async (path: string) => {
  if (!path.endsWith("/")) return false;

  const result = await list({
    path,
    options: { listAll: true },
  });
  const realChildren = result.items.filter(
    (item) => item.path !== path
  );
  return realChildren.length > 0;
};


  const performDelete = async () => {
    

    try {
      setIsDeleting(true);

      for (const path of selectedPaths) {
        const hasChildren = await isFolderWithObjects(path);

        if (hasChildren) {
          setErrorMsg(
            "Cannot delete a folder that contains objects. Please delete its contents first."
          );
          setErrorOpen(true);
          setIsDeleting(false);
          return; 
        }
      }

    
      if (currentCaseNumber) {
        await deleteEvidence({
          caseNumber: currentCaseNumber,
          objectKeys: selectedPaths,
        });

        queryClient.invalidateQueries({
          queryKey: ["evidence", currentCaseNumber],
        });
      }

      // -----------------------------------------
      // CASE 2: Root-level case deletion
      // -----------------------------------------
      else {
        await deleteCase(selectedPaths);
        queryClient.invalidateQueries({ queryKey: ["cases"] });
      }

      // -----------------------------------------
      // SAFETY: Ensure S3 delete (fallback)
      // -----------------------------------------
      await Promise.all(
        selectedPaths.map((path) =>
          remove({ path }).catch((err) =>
            console.warn("S3 remove fallback failed:", err)
          )
        )
      );

      onDeleted();
      setConfirmOpen(false);
    } catch (err) {
      console.error("Delete failed:", err);
      setErrorMsg("Failed to delete one or more items.");
      setErrorOpen(true);
    }finally{
      setIsDeleting(false);
      setConfirmOpen(false);
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

      {/* CONFIRM DIALOG */}
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
          <Button variation="destructive" onClick={performDelete} isLoading={isDeleting}
          loadingText="Deleting...">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ERROR DIALOG */}
      <Dialog open={errorOpen} onClose={() => setErrorOpen(false)}>
        <DialogTitle>Deletion error</DialogTitle>
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
