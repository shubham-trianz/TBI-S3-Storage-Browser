import { uploadData } from "aws-amplify/storage";
import { Button } from "@aws-amplify/ui-react";

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
  const handleCreateFolder = async () => {
    const folderName = window.prompt("Enter folder name");

    if (!folderName) return;

    // Basic validation
    if (folderName.includes("/")) {
      alert("Folder name cannot contain '/'");
      return;
    }

    const folderPath = `${basePath}${folderName}/`;

    try {
      // Create empty object to represent folder
      await uploadData({
        path: folderPath,
        data: new Blob([]),
      }).result;

      onCreated();
    } catch (err) {
      console.error("Error creating folder", err);
      alert("Failed to create folder");
    }
  };

  return (
    <Button
      size="small"
      variation="secondary"
      onClick={handleCreateFolder}
      isDisabled={disabled}
    >
      New Folder
    </Button>
  );
};
