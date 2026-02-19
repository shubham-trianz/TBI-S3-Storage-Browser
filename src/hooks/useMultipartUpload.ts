import { useRef, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUploadAPI } from "../api/fileupload";
import { createChunks } from "../components/utils/createChunks";
import toast from "react-hot-toast";

interface UploadInput {
  file: File;
  key: string;
  metadata: Record<string, string>;
}

interface UploadResult {
  location: string;
}

interface StoredUpload {
  uploadId: string;
  key: string;
  fileName: string;
  fileType: string;
  uploadedParts: { PartNumber: number; ETag: string }[];
}

const STORAGE_KEY = "multipart-upload";

export function useFileUploader() {
  const [progress, setProgress] = useState(0);
  const [hasStoredUpload, setHasStoredUpload] = useState(false);

  const pauseRef = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const queryClient = useQueryClient();

  const pause = () => {
    pauseRef.current = true;
    setIsPaused(true);
  };

  const resume = () => {
    pauseRef.current = false;
    setIsPaused(false);
  };

  useEffect(() => {
  const handleOffline = () => {
    pauseRef.current = true;
    setIsPaused(true);
    setIsNetworkError(true);
  };

  const handleOnline = () => {
    setIsNetworkError(false);
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
  };
}, []);



  // Check for stored upload on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHasStoredUpload(true);
    }
  }, []);

  const uploadMutation = useMutation<UploadResult | null, Error, UploadInput>({
    mutationFn: async ({ file, key, metadata }) => {
      setProgress(0);

      let uploadId: string;
      let uploadedParts: { PartNumber: number; ETag: string }[] = [];

      // Resume if stored upload exists
      const storedRaw = localStorage.getItem(STORAGE_KEY);

      if (storedRaw) {
        const stored: StoredUpload = JSON.parse(storedRaw);
        uploadId = stored.uploadId;
        uploadedParts = stored.uploadedParts;
      } else {
        const init = await FileUploadAPI.initiate(
          key,
          file.type,
          metadata
        );
        uploadId = init.uploadId;

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            uploadId,
            key,
            fileName: file.name,
            fileType: file.type,
            uploadedParts: [],
          })
        );
      }

      const chunks = createChunks(file);
      const partNumbers = chunks.map((_, i) => i + 1);

      const BATCH_SIZE = 20;

      for(let i=0; i<chunks.length; i += BATCH_SIZE){
        const batchParts = partNumbers.slice(i, i+BATCH_SIZE);

        while (pauseRef.current) {
          await new Promise(r => requestAnimationFrame(r));
        }
        const { urls } = await FileUploadAPI.presign(uploadId, key, batchParts);

        await Promise.all(
          urls.map(async (url, idx) => {
            const partNumber = batchParts[idx];
            if (uploadedParts.find(p => p.PartNumber === partNumber)) return;

            while (pauseRef.current) await new Promise(r => requestAnimationFrame(r));

            const resp = await fetch(url.url, { method: "PUT", body: chunks[partNumber - 1] });
            if (!resp.ok) throw new Error("Upload failed");
            const etag = resp.headers.get("etag");
            if (!etag) throw new Error("Missing ETag");
            uploadedParts.push({ PartNumber: partNumber, ETag: etag });
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ uploadId, key, fileName: file.name, fileType: file.type, uploadedParts }));
            setProgress(Math.round((uploadedParts.length / chunks.length) * 100));
          })
        );
      }

      if (pauseRef.current) return null;
      const sortedParts = uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
      const result = await FileUploadAPI.complete({
        uploadId,
        key,
        parts: sortedParts,
      });

      // Clear storage after success
      localStorage.removeItem(STORAGE_KEY);
      setHasStoredUpload(false);

      return result;
    },
    onSuccess: () =>  {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      toast.success('File Uploaded')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  });

  return {
    uploadMutation,
    progress,
    pause,
    resume,
    hasStoredUpload,
    isPaused,
    isNetworkError
  };
}
