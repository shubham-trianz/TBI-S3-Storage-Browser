import { remove, list } from "aws-amplify/storage";
import { Button, Flex } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { fetchAuthSession } from "aws-amplify/auth";
import { useUser } from "../../context/UserContext";

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

  const { user_name } = useUser();
  

  const deleteCase = async (selectedPaths: any) => {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    console.log('payloadddd: ', selectedPaths)
    
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    
    const payload = {
      user_name: user_name,
      selectedPaths: selectedPaths
    }
    const res = await fetch(`${apiBaseUrl}/cases`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
  
    return await res.json();
  }

  useEffect(() => {
    if (!errorOpen) return;

    const timer = setTimeout(() => {
      setErrorOpen(false);
      setErrorMsg(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [errorOpen]);

  const handleDeleteClick = async () => {
    if (selectedPaths.length === 0) return;

    try {
      console.log('selectedPaths: ', selectedPaths)
      for (const path of selectedPaths) {
        if (path.endsWith("/")) {
          const result = await list({ path });
          console.log('result for deletion: ', result)

          // Ignore the folder marker itself
          const hasFiles = result.items.some(
            (item) => item.path !== path
          );

          if (hasFiles) {
            setErrorMsg(
              "Cannot delete folder because it contains files."
            );
            setErrorOpen(true);
            return; 
          }
        }
      }

      setConfirmOpen(true);
    } catch (err) {
      console.error("Folder check failed", err);
      setErrorMsg("Unable to validate folder contents");
      setErrorOpen(true);
    }
  };

  const performDelete = async () => {
    console.log('performing delete')
    setConfirmOpen(false);

    let flag = 0;
    for(const path of selectedPaths){
      console.log('path: ', path)
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 3 && /^\d{4}-\d{7}$/.test(parts[2])) {
        console.log('true')
        // deleteCase(parts[2]);
      }else{
        flag = 1
        break;
      }
    }

    if(!flag){
      deleteCase(selectedPaths);
    }

    // deleteCase(selectedPaths)

    try {
      await Promise.all(
        selectedPaths.map((path) => remove({ path }))
      );
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
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Confirm delete</DialogTitle>
        <DialogContent>
          <Typography>
            Delete {selectedPaths.length} item(s)? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variation="link"
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variation="destructive"
            onClick={performDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
      >
        <DialogTitle>Deletion not allowed</DialogTitle>
        <DialogContent>
          <Typography>{errorMsg}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variation="primary"
            onClick={() => setErrorOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
