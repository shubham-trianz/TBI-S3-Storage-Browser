// UploadDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
// import { useAuth } from '../auth-context';
import { fetchAuthSession } from 'aws-amplify/auth';


type Props = {
  open: boolean;
  onClose: () => void;
};

export function UploadDialog({ open, onClose }: Props) {
  
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({
    caseId: '',
    documentType: '',
    uploadedBy: '',
    description: '',
  });

  const handleUpload = async () => {
    const session = await fetchAuthSession();
    const identityId = session.identityId!
    if (!file || !identityId) return;

    await uploadData({
      path: `private/${identityId}/uploads/${file.name}`,
      data: file,
      options: {
        contentType: file.type,
        metadata: meta,
      },
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload file</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {/* File picker */}
          <Button variant="outlined" component="label">
            Browse file
            <input
              type="file"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Button>

          {file && <span>Selected: {file.name}</span>}

          {/* Metadata fields */}
          <TextField
            label="Case ID"
            value={meta.caseId}
            onChange={(e) =>
              setMeta({ ...meta, caseId: e.target.value })
            }
          />

          <TextField
            label="Document Type"
            value={meta.documentType}
            onChange={(e) =>
              setMeta({ ...meta, documentType: e.target.value })
            }
          />

          <TextField
            label="Uploaded By"
            value={meta.uploadedBy}
            onChange={(e) =>
              setMeta({ ...meta, uploadedBy: e.target.value })
            }
          />

          <TextField
            label="Description"
            multiline
            rows={2}
            value={meta.description}
            onChange={(e) =>
              setMeta({ ...meta, description: e.target.value })
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
