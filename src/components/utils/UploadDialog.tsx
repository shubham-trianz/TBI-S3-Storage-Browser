// UploadDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { uploadData } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import { FileUploader } from '@aws-amplify/ui-react-storage';


type Props = {
  open: boolean;
  onClose: () => void;
  prefix: string;
  onUploaded?: () => void;
};

export function UploadDialog({
  open,
  onClose,
  prefix,
  onUploaded,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedBy, setUploadedBy] = useState("");
  const [error, setError] = useState<string | null>(null);

  // const [meta, setMeta] = useState({
  //   evidenceNumber: "",
  //   description: "",
  // });
  const evidenceNumberRef = useRef(null);
  const evidenceDescriptionRef = useRef(null);


  /* 🔹 Load logged-in user */
  useEffect(() => {
    async function loadUser() {
      const session = await fetchAuthSession();
      const username =
        session.tokens?.idToken?.payload?.email ??
        session.tokens?.idToken?.payload?.["cognito:username"] ??
        "";
      setUploadedBy(String(username));
    }
    loadUser();
  }, []);

  const validateEvidenceNumber = (value: string) => {
    return /^\d{4}-\d{7}-E\d+$/.test(value);
  };

  // const handleUpload = async () => {
  //   if (!file) return;

  //   if (!validateEvidenceNumber(meta.evidenceNumber)) {
  //     setError(
  //       "Evidence Number must be in format: YYYY-XXXXXXX-EXXXXX"
  //     );
  //     return;
  //   }

  //   try {
  //     const fullPath = `${prefix}${file.name}`;

  //     await uploadData({
  //       path: fullPath,
  //       data: file,
  //       options: {
  //         contentType: file.type,
  //         metadata: {
  //           evidenceNumber: meta.evidenceNumber,
  //           description: meta.description,
  //           uploadedBy,
  //         },
  //       },
  //     }).result;

  //     onUploaded?.();
  //     onClose();
  //   } catch (err) {
  //     console.error("Upload failed", err);
  //     setError("Upload failed");
  //   }
  // };

  const processFile = ({ file }) => {

    if (!file) return;

    const evidenceNumber = evidenceNumberRef.current?.value || '';
    const description = evidenceDescriptionRef.current?.value || '';

    console.log('evidenceNumber: ', evidenceNumber)
    console.log('description: ', description)
    if (!validateEvidenceNumber(evidenceNumber)) {
      setError(
        "Evidence Number must be in format: YYYY-XXXXXXX-EXXXXX"
      );
      return;
    }
    const key = `${prefix}${file.name}`;
    console.log('key: ', key)
    return {
      file,
      key,
      metadata: {
        evidenceNumber: evidenceNumber,
        description: description,
      },
    };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Evidence</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {/* <Button variant="outlined" component="label">
            Browse file
            <input
              type="file"
              hidden
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
            />
          </Button> */}
          

          {/* {file && <span>Selected: {file.name}</span>} */}

          <TextField
            required
            label="Kaseware Evidence Number"
            placeholder="2025-1234567-E00001"
            // value={meta.evidenceNumber}
            // onChange={(e) =>
            //   setMeta({ ...meta, evidenceNumber: e.target.value })
            // }
            inputRef={evidenceNumberRef}
            // error={
            //   !!meta.evidenceNumber &&
            //   !validateEvidenceNumber(meta.evidenceNumber)
            // }
            helperText="Format: YYYY-XXXXXXX-EXXXXX"
          />

          <TextField
            label="Description"
            multiline
            rows={2}
            inputRef={evidenceDescriptionRef}
            // value={meta.description}
            // onChange={(e) =>
            //   setMeta({ ...meta, description: e.target.value })
            // }
          />

          {/* <TextField
            label="Uploaded By"
            value={uploadedBy}
            disabled
          /> */}
          <FileUploader
            acceptedFileTypes={['image/*']}
            path=''
            maxFileCount={1}
            isResumable
            autoUpload={false}
            processFile={processFile}
          />

          {error && (
            <span style={{ color: "red" }}>{error}</span>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {/* <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file}
        >
          Upload
        </Button> */}
      </DialogActions>
    </Dialog>
  );
}
