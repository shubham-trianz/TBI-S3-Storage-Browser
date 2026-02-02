import { remove } from "aws-amplify/storage";
import { Button, Flex } from "@aws-amplify/ui-react";

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
  const handleDelete = async () => {
    if (selectedPaths.length === 0) return;

    const confirm = window.confirm(
      `Delete ${selectedPaths.length} item(s)? This cannot be undone.`
    );
    if (!confirm) return;

    try {
      await Promise.all(
        selectedPaths.map((path) =>
          remove({ path })
        )
      );

      onDeleted();
    } catch (err) {
      console.error("Error deleting objects", err);
      alert("Failed to delete one or more items");
    }
  };

  return (
    <Flex>
      <Button
        size="small"
        variation="destructive"
        isDisabled={disabled || selectedPaths.length === 0}
        onClick={handleDelete}
      >
        Delete
      </Button>
    </Flex>
  );
};
