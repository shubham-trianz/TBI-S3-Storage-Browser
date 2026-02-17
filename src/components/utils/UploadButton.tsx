// import { uploadData } from "aws-amplify/storage";
import { Button } from "@aws-amplify/ui-react";
import { useState, useEffect } from "react";
import { UploadDialog } from "./UploadDialog";
type UploadButtonProps = {
  prefix: string; // MUST be full path ending with /
  onUploaded?: () => void;
  droppedFile?: File | null;
};

export const UploadButton = ({ prefix, onUploaded, droppedFile }: UploadButtonProps) => {
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (droppedFile) {
      setOpen(true);
    }
  }, [droppedFile]);

return (
    <>
      <Button size="small" variation="primary" onClick={() => setOpen(true)}>
        Upload
      </Button>

      <UploadDialog
        open={open}
        onClose={() => setOpen(false)}
        prefix={prefix}
        initialFile={droppedFile}
        onUploaded={() => {
          onUploaded?.();
          setOpen(false);
        }}
      />
    </>
  );
};