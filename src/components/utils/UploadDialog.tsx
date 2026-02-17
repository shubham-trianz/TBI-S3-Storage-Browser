import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  LinearProgress,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import { Pause, PlayArrow } from "@mui/icons-material";
import { useState, useRef, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useQueryClient } from "@tanstack/react-query";
import { useFileUploader } from "../../hooks/useMultipartUpload";

type Props = {
  open: boolean;
  onClose: () => void;
  prefix: string;
  onUploaded?: () => void;
  initialFile?: File | null;
};

export function UploadDialog({
  open,
  onClose,
  prefix,
  onUploaded,
  initialFile
}: Props) {
  const { user_name } = useUser();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const evidenceNumberRef = useRef<HTMLInputElement | null>(null);
  const evidenceDescriptionRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
    }
  }, [initialFile]);

  useEffect(() => {
  if (!open) {
    setFile(null);
    setError(null);
  }
  }, [open]);

  const {
    uploadMutation,
    progress,
    pause,
    resume,
    isPaused,
    isNetworkError
  } = useFileUploader();

  const validateEvidenceNumber = (value: string) =>
    /^\d{4}-\d{7}-E\d+$/.test(value);

  const handleUpload = async () => {
    if (!file) return;

    const evidenceNumber = evidenceNumberRef.current?.value || "";
    const description = evidenceDescriptionRef.current?.value || "";

    if (!validateEvidenceNumber(evidenceNumber)) {
      setError("Evidence Number must be YYYY-XXXXXXX-EXXXXX");
      return;
    }

    setError(null);

    try {
      setLoading(true)
      const result = await uploadMutation.mutateAsync({
        file,
        key: `${prefix}${file.name}`,
        metadata: {
          evidenceNumber,
          description,
          user_name,
          case_number: `${prefix}${file.name}`.split('/')[2]
        },
      });

      if (result?.location) {
        queryClient.invalidateQueries({ queryKey: ["cases"] });
        onUploaded?.();
        onClose();
      }
      setLoading(false)
    } catch (err) {
      setLoading(false)
      console.error(err);
      setError("Upload failed");
    }
  };

  const togglePause = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Upload Evidence
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} mt={1}>
          <TextField
            required
            label="Kaseware Evidence Number"
            placeholder="2025-1234567-E00001"
            inputRef={evidenceNumberRef}
            helperText="Format: YYYY-XXXXXXX-EXXXXX"
            fullWidth
          />

          <TextField
            label="Description"
            multiline
            rows={2}
            inputRef={evidenceDescriptionRef}
            fullWidth
          />

          <Button
            variant="outlined"
            component="label"
            disabled={loading}
          >
            Select File
            <input
              type="file"
              hidden
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
            />
          </Button>

          {file && (
            <Typography variant="body2" color="text.secondary">
              {file.name}
            </Typography>
          )}

          {/* Modern Progress Section */}
          {uploadMutation.isPending && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 5,
                }}
              />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mt={1}
              >
                <Typography variant="caption">
                  {/* {isPaused ? "Paused" : `${progress}% uploaded`} */}
                  {isNetworkError
                    ? "Paused — Network disconnected"
                    : isPaused
                    ? "Paused"
                    : `${progress}% uploaded`}
                </Typography>

                <IconButton
                  size="small"
                  disabled={isNetworkError && !navigator.onLine}
                  onClick={togglePause}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {isPaused ? (
                    <PlayArrow fontSize="small" />
                  ) : (
                    <Pause fontSize="small" />
                  )}
                </IconButton>
              </Stack>
            </Box>
          )}

          {error && (
            <Typography color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
          sx={{ borderRadius: 3 }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
