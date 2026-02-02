import { useState } from 'react';
import { Button } from '@mui/material';
import { UploadDialog } from './UploadDialog';

export function UploadButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Upload
      </Button>

      <UploadDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
