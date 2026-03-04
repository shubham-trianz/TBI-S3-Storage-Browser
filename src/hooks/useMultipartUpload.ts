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


export function useFileUploader() {
  const [progress, setProgress] = useState(0);
  const [hasStoredUpload, setHasStoredUpload] = useState(false);

  const pauseRef = useRef(false);
  const controllersRef = useRef<AbortController[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);


  const [isPaused, setIsPaused] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const queryClient = useQueryClient();
  const currentUploadRef = useRef<{ uploadId: string; key: string } | null>(null);

  const pause = () => {
    console.log('paused clicked')
    if (pauseRef.current) return; // prevent double pause
    pauseRef.current = true;
    setIsPaused(true);
    controllersRef.current.forEach(c => {
      try {
        console.log('abortinggggggg: ', c)
        c.abort();
      } catch {
        //
      }
  });
    controllersRef.current = [];
  };

  const resume = () => {
    console.log('resume clicked')
    pauseRef.current = false;
    setIsPaused(false);
  };

  async function runWithLimit(
    tasks: (() => Promise<void>)[],
    limit: number
  ) {
    let index = 0;
    const workers = Array.from({ length: limit }).map(async () => {
      while(true){
        if(index >= tasks.length) break;

        const currentIndex = index++;
        // try{
        await uploadWithRetry(tasks[currentIndex]);
        // index++;
        // }
        // catch(err){
        //   throw err
        // }
      }
      // while (index < tasks.length) {
      //   const currentIndex = index++;
      //   await uploadWithRetry(tasks[currentIndex]);
      // }
    });

    await Promise.all(workers);
  }

  async function uploadWithRetry(
    task: () => Promise<void>,
    retries = 3
  ) {
    let attempt = 0;

    while (attempt < retries) {
      while (pauseRef.current) {
        await new Promise(r => requestAnimationFrame(r));
      }
      try {
        return await task();
      } catch (error) {
        const err = error as { name?: string, message?: string };
        console.log('failed this upload: ', error)
        if(err?.name === "TypeError" || err?.message === "Failed to fetch"){
          console.log('errrorrr in puttttt in catch: ', error)
          pauseRef.current = true;
          setIsPaused(true);
          setIsNetworkError(true);
          // return
        }
        // const err = error as { name?: string };
        // if (err?.name === "AbortError") {
          // If paused intentionally, do NOT retry
          console.log('inside abort error')
          if (pauseRef.current) {
            // console.log('silently exiting')
            // return; // silently exit
            while(pauseRef.current){
              await new Promise(r => requestAnimationFrame(r));
            }
            continue;
          }
        // }
        attempt++;
        console.log(`failed this upload. Retrying for ${attempt} time`)
        if (attempt >= retries) throw err;

        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  useEffect(() => {
  const handleOffline = () => {
    pauseRef.current = true;
    console.log('handling off lineeeeeeeee')
    setIsPaused(true);
    setIsNetworkError(true);

    controllersRef.current.forEach(c => {
      try{
        c.abort();
      }
      catch{}
    })
    controllersRef.current = []
  };

  const handleOnline = () => {
    setIsNetworkError(false);
    pauseRef.current = false;
    setIsPaused(false)
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
  };
}, []);

  const getStorageKey = (key: string) =>`multipart-upload-${key}`;

  const cancelUpload = async () => {
    pauseRef.current = true;
    setIsPaused(false);
    setIsNetworkError(false);

    controllersRef.current.forEach(c => {
      try { c.abort(); } catch {}
    });
    controllersRef.current = [];

    if (currentUploadRef.current) {
      try {
        await FileUploadAPI.abort(
          currentUploadRef.current.uploadId,
          currentUploadRef.current.key
        );
      } catch {
        // ignore backend failure
      }
    }

    // clear local storage
    const storageKey = `multipart-upload-${currentUploadRef.current?.key}`;
    localStorage.removeItem(storageKey);

    setProgress(0);
  };

  const retryUpload = () => {
    console.log('retry clicked')
    console.log('uploadMutation: ', uploadMutation)
    console.log('uploadMutation.variables: ', uploadMutation.variables)
    if (!uploadMutation.variables) return;

    console.log('retryinggg....')
    uploadMutation.mutate(uploadMutation.variables);
  };


  const uploadMutation = useMutation<UploadResult | null, Error, UploadInput>({
    mutationFn: async ({ file, key, metadata }) => {
      const storageKey = getStorageKey(key);
      pauseRef.current = false;
      setIsPaused(false);
      setIsNetworkError(false);
      controllersRef.current = [];

      try{
        setProgress(0);

        let uploadId: string;
        const uploadedPartsMap = new Map<number, string>();

        // Resume if stored upload exists
        const storedRaw = localStorage.getItem(storageKey);

        if (storedRaw) {
          const stored: StoredUpload = JSON.parse(storedRaw);
          console.log('storeddddd: ', stored)
          uploadId = stored.uploadId;
          if (stored.key !== key) {
            localStorage.removeItem(storageKey);
          } else {
            uploadId = stored.uploadId;
            stored.uploadedParts.forEach(p => {
              uploadedPartsMap.set(p.PartNumber, p.ETag);
            });
          }
          currentUploadRef.current = { uploadId, key };
        } else {
          const init = await FileUploadAPI.initiate(
            key,
            file.type,
            metadata
          );
          uploadId = init.uploadId;
          console.log('uploadId: ', uploadId)
          currentUploadRef.current = { uploadId, key };
          localStorage.setItem(
            storageKey,
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

        const tasks = partNumbers.map((partNumber) => {
          return async () => {

            // if (uploadedParts.find(p => p.PartNumber === partNumber)) return;
            if (uploadedPartsMap.has(partNumber)) return;

            while (pauseRef.current) {
              await new Promise(r => requestAnimationFrame(r));
            }

            const { urls } = await FileUploadAPI.presign(uploadId, key, [partNumber]);
            const url = urls[0];
            console.log('urlllll: ', url)
            const controller = new AbortController();
            controllersRef.current.push(controller);
            const resp = await fetch(url.url, {
              method: "PUT",
              body: chunks[partNumber - 1],
              signal: controller.signal
            })
            // .catch(error => {
            //   console.log('error in catch: ', error)
            //   console.log('nnnnnnnnnnnnnnnnn: ', navigator)
              // if(error?.name === "TypeError" || error?.message === "Failed to fetch"){
              //   console.log('errrorrr in puttttt: ', error)
              //   pauseRef.current = true;
              //   setIsPaused(true);
              //   setIsNetworkError(true);
              //   return
              // }
              
            //   throw error
            // });
            console.log('resppppp: ', resp)
            controllersRef.current = controllersRef.current.filter(c => c !== controller);

            if (!resp.ok) throw new Error("Upload failed");

            const etag = resp.headers.get("etag");
            if (!etag) throw new Error("Missing ETag");

            // uploadedParts.push({ PartNumber: partNumber, ETag: etag });
            uploadedPartsMap.set(partNumber, etag);
            const partsArray = Array.from(uploadedPartsMap.entries()).map(([PartNumber, ETag]) => ({ PartNumber, ETag }));

            localStorage.setItem(storageKey, JSON.stringify({
              uploadId,
              key,
              fileName: file.name,
              fileType: file.type,
              uploadedParts: partsArray
            }));

            console.log('partsArray: ', partsArray)

            // setProgress(Math.round((uploadedParts.length / chunks.length) * 100));
            console.log('uploadedPartsMap.size: ', uploadedPartsMap.size)
            console.log('chunks.length: ', chunks.length)
            setProgress(Math.round((uploadedPartsMap.size / chunks.length) * 100));
          };
        });


        const CONCURRENCY_LIMIT = 3;

        await runWithLimit(tasks, CONCURRENCY_LIMIT);


        // if (pauseRef.current) return null;
        // const sortedParts = uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
        const sortedParts = Array.from(uploadedPartsMap.entries())
                            .map(([PartNumber, ETag]) => ({ PartNumber, ETag }))
                            .sort((a, b) => a.PartNumber - b.PartNumber);

        if(pauseRef.current) {
          // setIsNetworkError(true)
          throw new Error('Upload paused');
        }
        // if(pauseRef.current) return

        if (uploadedPartsMap.size !== chunks.length) {
          setIsNetworkError(true)
          throw new Error("Upload incomplete. Some parts failed.");
        }
        const result = await FileUploadAPI.complete({
          uploadId,
          key,
          parts: sortedParts,
        });
        console.log('upload complete: ', result)
        console.log('sortedParts complete: ', sortedParts)
        console.log('total parts uploaded: ', sortedParts.length)
        console.log('chunks.length: ', chunks.length)
        // Clear storage after success
        localStorage.removeItem(storageKey);
        setHasStoredUpload(false);
        setIsCompleted(true)
        return result;
      }catch(error: unknown){
        const err = error as { name?: string };
        if (err?.name === "AbortError") {
          // intentional pause — do nothing
          return null;
        }
        if (!navigator.onLine) {
          pauseRef.current = true;
          setIsPaused(true);
          setIsNetworkError(true);
        }
        throw error;
      }
    },
    onSuccess: () =>  {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      setProgress(0)
      setIsPaused(false)
      pauseRef.current = false
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
    cancelUpload,
    retryUpload,
    hasStoredUpload,
    isPaused,
    isNetworkError,
    isCompleted
  };
}
