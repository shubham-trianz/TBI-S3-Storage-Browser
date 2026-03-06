import {
 Dialog,
 DialogTitle,
 DialogContent,
 DialogActions,
 Button,
 TextField,
 Stack,
 Typography,
} from "@mui/material";
import { useState, useEffect } from "react";

interface MetadataDialogProps {

 open: boolean;
  files: string[];

  initialMetadata?: {
    evidence_number?: string;
    description?: string;
  };
  onClose: () => void;
  onSave: (metadata: { evidence_number: string; description: string }) => Promise<void>;
}



// Strict format: YYYY-XXXXXXXX-EXXXXX

const EVIDENCE_NUMBER_REGEX = /^\d{4}-\d{7}-E\d{5}$/;
export const MetadataDialog = ({
  open,
  files,
  initialMetadata,
  onClose,
  onSave,
}: MetadataDialogProps) => {
  const [evidenceNumber, setEvidenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setEvidenceNumber(initialMetadata?.evidence_number ?? '');
      setDescription(initialMetadata?.description ?? '');
      setError('');
    }
  }, [open, initialMetadata]);
  const handleSave = async () => {
    if (!evidenceNumber) {
      setError('Evidence number is required');
      return;
    }
    if (!EVIDENCE_NUMBER_REGEX.test(evidenceNumber)) {
      setError('Format must be: YYYY-XXXXXXX-EXXXXX (e.g. 2025-1234567-E00001)');
      return;
    }
    setSaving(true);
    try {
      await onSave({ evidence_number: evidenceNumber, description });
      onClose();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={(reason) => {
        if (reason === 'backdropClick') return;
        onClose();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        Edit Metadata
        {files.length === 1 && (
          <Typography variant="body2" color="text.secondary" fontWeight={400}>
            {files[0].split('/').pop()}
          </Typography>
        )}
        {files.length > 1 && (
          <Typography variant="body2" color="text.secondary" fontWeight={400}>
            {files.length} files selected
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} mt={1}>
          <TextField
            label="Evidence Number"
            placeholder="2025-1234567-E00001"
            value={evidenceNumber}
            onChange={(e) => {
              setEvidenceNumber(e.target.value);
              setError('');
            }}
            helperText={error || "Format: YYYY-XXXXXXX-EXXXXX"}
            error={!!error}
            fullWidth
          />
          <TextField
            label="Description"
            placeholder="Describe this evidence..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 3 }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};