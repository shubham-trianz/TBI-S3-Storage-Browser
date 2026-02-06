// import { uploadData } from "aws-amplify/storage";
import { Button } from "@aws-amplify/ui-react";
import { useState } from "react";
import { UploadDialog } from "./UploadDialog";
type UploadButtonProps = {
  prefix: string; // MUST be full path ending with /
  onUploaded?: () => void;
};

export const UploadButton = ({ prefix, onUploaded }: UploadButtonProps) => {
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  
return (
    <>
      <Button size="small" variation="primary" onClick={() => setOpen(true)}>
        Upload
      </Button>

      <UploadDialog
        open={open}
        onClose={() => setOpen(false)}
        prefix={prefix}
        onUploaded={() => {
          onUploaded?.();
          setOpen(false);
        }}
      />
    </>
  );
};