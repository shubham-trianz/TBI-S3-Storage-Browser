import { uploadData } from "aws-amplify/storage";
import { Button } from "@aws-amplify/ui-react";
import { useRef, useState } from "react";
import { UploadDialog } from "./UploadDialog";
type UploadButtonProps = {
  prefix: string; // MUST be full path ending with /
  onUploaded?: () => void;
};

export const UploadButton = ({ prefix, onUploaded }: UploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fullPath = `${prefix}${file.name}`;

      await uploadData({
        path: fullPath,
        data: file,
      }).result;

      onUploaded?.();
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      e.target.value = "";
    }
  };

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