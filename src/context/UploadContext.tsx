import { createContext, useContext, useState } from "react";

// export type UploadItem = {
//   id: string;
//   fileName: string;
//   progress: number;
//   status: "queued" | "uploading" | "paused" | "error" | "completed";
// };
import UploadWorker from '../components/utils/UploadWorker'
type UploadItem = {
  id: string;
  file: File;
  progress: number;
  evidenceNumber: string;
  description: string;
  isPaused: boolean;
  status: "uploading" | "paused" | "error" | "completed";
  prefix: string,
  controller: {
    pause: () => void;
    resume: () => void;
    retry: () => void;
    cancel: () => void;
  };
};


type UploadFileItem = {
  file: File,
  evidenceNumber: string,
  description: string,
}

interface UploadContextType {
  uploads: UploadItem[];
  addFiles: (file: UploadFileItem[]) => void;
  updateIsPausedStatus: (id: string, isPaused: boolean) => void;
  updateProgress: (id: string, progress: number) => void;
  attachController: (id: string, controller: UploadItem['controller']) => void;
  updateStatus: (id: string, status: "uploading" | "paused" | "error" | "completed") => void;
  destinationPath: (prefix: string) => void
}

const UploadContext = createContext<UploadContextType | null>(null);

export const UploadProvider = ({ children }: { children: React.ReactNode }) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const addFiles = (files: UploadFileItem[]) => {
    const fileArray = Array.from(files);
    
    // const newUpload: UploadItem = {
    //   id: crypto.randomUUID(),
    //   file: file,
    //   progress: 0,
    //   status: "uploading",
    // };
    const newUploads = fileArray.map((item) => {
      const id = crypto.randomUUID();

      const controller = {
        pause: () => {},
        resume: () => {},
        retry: () => {},
        cancel: () => {
          setUploads((prev) => prev.filter((u) => u.id != id));
        }
      }
      return {
        id, 
        file: item.file,
        evidenceNumber: item.evidenceNumber,
        description: item.description,
        progress: 0,
        isPaused: false,
        prefix: '',
        status: 'uploading' as const,
        controller
      }
    })
    console.log('newUploadssssL ', newUploads)

    setUploads((prev) => [...prev, ...newUploads]);
  };
  const updateProgress = (id: string, progress: number) => {
    setUploads(prev =>
      prev.map(u => u.id === id ? { ...u, progress }: u
    )
    )
  }

  const updateIsPausedStatus = (id: string, isPaused: boolean) => {
    setUploads(prev => prev.map(u => u.id === id ? {...u, isPaused }: u))
  }

  const attachController = (id: string, controller: UploadItem['controller']) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, controller}: u))
  }

  const updateStatus = (id: string, status: "uploading" | "paused" | "error" | "completed") => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status}: u))
  }
  const destinationPath = (prefix: string) => {
    setUploads(prev => prev.map(u => u.prefix === ""? ({...u,prefix}):u))
  }
  console.log('uploadsssssssssssss: ', uploads)
  return (
    <UploadContext.Provider value={{ uploads, addFiles, updateIsPausedStatus, updateProgress, attachController, updateStatus, destinationPath }}>
      {children}
      {uploads.map(upload => (
        <UploadWorker key={upload.id} item={upload} />
      ))}
    </UploadContext.Provider>
  );
};


export const useUploadManager = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) {
    throw new Error("useUploadManager must be used within UploadProvider");
  }
  return ctx;
};