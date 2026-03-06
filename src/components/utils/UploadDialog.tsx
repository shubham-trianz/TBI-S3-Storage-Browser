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
  InputAdornment
} from "@mui/material";
import { Pause, PlayArrow } from "@mui/icons-material";
import { useState, useEffect } from "react";
// import { useUser } from "../../context/UserContext";
// import {  useQueryClient } from "@tanstack/react-query";
import { useFileUploader } from "../../hooks/useMultipartUpload";

import { useUploadManager } from '../../context/UploadContext'
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  prefix: string;
  onUploaded?: () => void;
  initialFile?: File | null;
};

type UploadFileItem = {
  file: File,
  evidenceNumber: string,
  description: string,
   selected?: boolean
}

// type UploadItem = {
//   file: File,
//   progress: number,
//   isPaused: boolean,
//   isError: boolean
// }

// type UploadItem = {
//   id: string;
//   file: File;
//   progress: number;
//   status: "uploading" | "paused" | "error" | "completed";
//   controller: {
//     pause: () => void;
//     resume: () => void;
//     retry: () => void;
//     cancel: () => void;
//   };
// };

export function UploadDialog({
  open,
  onClose,
  prefix,
  onUploaded,
  // initialFile
}: Props) {
  // const { user_name } = useUser();
  // const queryClient = useQueryClient();

  // const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const evidencePrefix = `${prefix.split('/')[2]}-E`
  // const evidenceNumberRef = useRef<HTMLInputElement | null>(null);
  // const evidenceDescriptionRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  // const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepMode, setStepMode] = useState(false);

  const { addFiles, destinationPath } = useUploadManager()
  console.log('prefoxxx: ', prefix)
  const isTemptab = location.pathname.includes("temp")
  const {
    uploadMutation,
    progress,
    pause,
    resume,
    cancelUpload,
    retryUpload,
    isPaused,
    isNetworkError
  } = useFileUploader();

  // useEffect(() => {
  //   if (initialFile) {
  //     setFiles([{file: initialFile, evidenceNumber: "", description: ""}]);
  //   }
  // }, [initialFile]);

  useEffect(() => {
  if (!open) {
    setFiles([]);
    setError(null);
  }
}, [open]);

  const validateEvidenceNumber = (value: string) =>
    /^\d{4}-\d{7}-E\d{5}$/.test(value);

  useEffect(() => {
    if (uploadMutation.isSuccess) {
      onUploaded?.();
      onClose();
    }
  }, [uploadMutation.isSuccess]);

  // useEffect(() => {
  //   // files.map((file: File) => {
  //   //   addFiles(file)
  //   // })
  //   addFiles(files)

  // }, [files])

  // const handleUpload = async () => {
  //   if (!files.length) return;

  //   setError(null);
  //   setLoading(true)
  //   try {
      
  //     // const result = await uploadMutation.mutateAsync({
  //     //   file,
  //     //   key: `${prefix}${file.name}`,
  //     //   metadata: {
  //     //     evidenceNumber,
  //     //     description,
  //     //     user_name,
  //     //     case_number: `${prefix}${file.name}`.split('/')[2]
  //     //   },
  //     // });

  //     // if (result?.location) {
  //     //   queryClient.invalidateQueries({ queryKey: ["files"] });
  //     //   queryClient.invalidateQueries({ queryKey: ["evidence"] });
  //     //   onUploaded?.();
  //     //   onClose();
  //     // }
  //     // setLoading(false)
  //     //   await Promise.all(
  //     //   files.map((file) =>
  //     //     uploadMutation.mutateAsync({
  //     //       file,
  //     //       key: `${prefix}${file.name}`,
  //     //       metadata: {
  //     //         evidenceNumber,
  //     //         description,
  //     //         user_name,
  //     //         case_number: `${prefix}${file.name}`.split("/")[2],
  //     //       },
  //     //     })
  //     //   )
  //     // );

  //     // queryClient.invalidateQueries({ queryKey: ["files"] });
  //     // queryClient.invalidateQueries({ queryKey: ["evidence"] });
  //     addFiles(files)
  //     destinationPath(prefix)
  //     setLoading(false)
  //     setStepMode(false)
  //     // onUploaded?.();
  //     if(files.length == 1)
  //       toast.success(`${files.length} file upload in progress...`)
  //     else if(files.length > 1)
  //       toast.success(`${files.length} files upload in progress...`)
  //     onClose();
  //   } catch (err) {
  //     setLoading(false)
  //     console.error(err);
  //     setError("Upload failed");
  //   }
  // };

  
const handleUpload = async () => {
  const filesToUpload = files.filter((f) => f.selected !== false);
  if (!filesToUpload.length) {
    setError("Please select at least one file to upload.");
    return;
  }

  setError(null);
  setLoading(true);
  try {
    addFiles(filesToUpload);
    destinationPath(prefix);
    setLoading(false);
    setStepMode(false);

    if (filesToUpload.length === 1)
      toast.success(`1 file upload in progress...`);
    else
      toast.success(`${filesToUpload.length} files upload in progress...`);

    onClose();
  } catch (err) {
    setLoading(false);
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

  const isCurrentValid = () => {
    const current = files[currentIndex];
    console.log('currentttt: ', current)
    return (
      validateEvidenceNumber(current?.evidenceNumber || "") && current?.description.trim() !== ""
    )
  }
  const isAllValid = () => {
    return files.every(
      (f) => validateEvidenceNumber(f.evidenceNumber) && f.description.trim() !== ""
    )
  }

  const handleFieldChange = (field: "evidenceNumber" | "description", value: string) => {
    const updated = [...files]
    if(field == 'evidenceNumber'){
      updated[currentIndex]['evidenceNumber'] = evidencePrefix + value
    }
    else if(field == 'description'){
      updated[currentIndex]['description'] = value;
    }
    
    setFiles(updated)
  }

const removeFileAt = (idx: number) => {
  setFiles((prev) => {
    const next = prev.filter((_, i) => i !== idx);
    
  if (!isTemptab && stepMode) {
        if (currentIndex >= next.length) {
          setCurrentIndex(Math.max(0, next.length - 1));
        }
      }
      return next;
    });
};

const selectedCount = files.filter((f) => f.selected !== false).length;

  useEffect(() => {
    if(selectedCount == 0){
      setStepMode(false)
    }
      
  }, [selectedCount])



  return (
    <Dialog 
      open={open} 
      onClose={(reason) => {
        if(reason == 'backdropClick') return;
        setFiles([]);
        setError(null);
        onClose();
      }} 
      maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Upload Evidence
        
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} mt={1}>
          {!stepMode && (
            <Button
            variant="outlined"
            component="label"
            disabled={loading}
          >
            Select File
            <input
              type="file"
              hidden
              multiple
              onChange={(e) =>
                {
                  // setFiles(e.target.files ? Array.from(e.target.files) : [])
                  const selected = e.target.files ? Array.from(e.target.files) : [];
                  // const formatted = selected.map((file) => ({
                  //   file,
                  //   evidenceNumber: "",
                  //   description: ""
                  // }))
                  
                  const formatted: UploadFileItem[] = selected.map((file) => ({
                      file,
                      evidenceNumber: "",
                      description: "",
                      selected: true // NEW
                    }));

                  setFiles(formatted)
                  setCurrentIndex(0);
                  setStepMode(true)
                }
                
              }
            />
          </Button>
          )}
          
            {isTemptab && files.length > 0 &&  (
              <Box sx={{ fontFamily: "inherit", fontSize: 20 }}>
                Total files selected {files.length}
              </Box>
            )}

        {isTemptab &&
          files.map((item, index) => (
            <Box
              key={item.file.name + index}
              sx={{
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                px: 1.5,
                py: 1
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                <Typography fontWeight={300} noWrap title={item.file.name}>
                  {item.file.name}
                </Typography>
              </Stack>

              {/* Remove button */}
              <IconButton
                aria-label="remove-file"
                color="error"
                onClick={() => removeFileAt(index)}
                title="Remove from list"
                size="small"
                sx={{ borderColor: "divider" }}
              >
                <DisabledByDefaultIcon/>
              </IconButton>
            </Box>
          ))}


          {stepMode && files.length > 0 && !isTemptab  && (
            <Box>
              <Typography fontWeight={600}>
                File {currentIndex + 1} of {files.length}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {files[currentIndex].file.name}
              </Typography>
              <TextField
                // required
                sx={{mt: 3}}
                label="Kaseware Evidence Number"
                placeholder="00001"
                // inputRef={evidenceNumberRef}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment sx={{fontWeight: 600}} position="start">
                        {evidencePrefix}
                      </InputAdornment>
                    )
                  }
                }}
                value={files[currentIndex].evidenceNumber?.replace(`${evidencePrefix}`, "")}
                onChange={(e) => {
                  handleFieldChange("evidenceNumber", e.target.value)
                }}
                error={
                  files[currentIndex].evidenceNumber !== "" && !validateEvidenceNumber(files[currentIndex].evidenceNumber)
                }
                helperText="Format: YYYY-XXXXXXX-EXXXXX"
                fullWidth
              />

              <TextField
                sx={{mt: 3}}
                label="Description"
                multiline
                rows={2}
                value={files[currentIndex].description}
                onChange={(e) => {
                  handleFieldChange("description", e.target.value)
                }}
                // inputRef={evidenceDescriptionRef}
                fullWidth
              />
            </Box>
          )}
          {/* <TextField
            // required
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
          /> */}

          {/* <Button
            variant="outlined"
            component="label"
            disabled={loading}
          >
            Select File
            <input
              type="file"
              hidden
              multiple
              onChange={(e) =>
                {
                  // setFiles(e.target.files ? Array.from(e.target.files) : [])
                  const selected = e.target.files ? Array.from(e.target.files) : [];
                  const formatted = selected.map((file) => ({
                    file,
                    evidenceNumber: "",
                    description: ""
                  }))
                  setFiles(formatted)
                  setCurrentIndex(0);
                  setStepMode(true)
                }
                
              }
            />
          </Button> */}

          {/* {files.map((f, index) => (
            <Typography key={index} variant="body2" color="text.secondary">
              {f.name}
            </Typography>
          ))} */}

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
          {uploadMutation.isError && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                setError(null)
                retryUpload()
              }}
            >
              Retry
            </Button>
          )}

          {error && (
            <Typography color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {/* <Button 
          onClick={() => {
            setFile(null);        
            setError(null);
            onClose();            
          }}>
            Cancel
        </Button> */}
        <Button
          onClick={async () => {
            await cancelUpload();
            setFiles([]);
            setStepMode(false)
            setError(null);
            onClose();
          }}
        >
          Cancel
        </Button>

        {stepMode  && !isTemptab && currentIndex > 0 && (
          <Button
            onClick={() => setCurrentIndex((prev) => prev-1)}
          >
            Previous
          </Button>
        )}
        {stepMode && !isTemptab && currentIndex < files.length - 1 && (
          <Button
            variant="contained"
            disabled={!isTemptab && !isCurrentValid()}
            onClick={() => setCurrentIndex((prev) => prev+1)}
          >
            Next
          </Button>
        )}

        {stepMode  && (isTemptab || currentIndex === files.length -1) && (
          <Button
            variant="contained"
            disabled={!isTemptab && !isAllValid()}
            // onClick={() => {
            //   try{
            //     console.log('prefffffffffffffffff: ', prefix)
            //     destinationPath(prefix)
            //     // const onlyFiles = files.map((f) => f.file);
            //     addFiles(files);
            //     setStepMode(false)
            //     onClose()
            //   }
            //   catch(err){
            //     setError('Upload Failed')
            //   }
            // }}
            onClick={handleUpload}
            sx={{borderRadius: 3}}
          >
            Upload All
          </Button>
        )}

        {/* <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!files || uploadMutation.isPending}
          sx={{ borderRadius: 3 }}
        >
          Upload
        </Button> */}
      </DialogActions>
    </Dialog>
  );
}
