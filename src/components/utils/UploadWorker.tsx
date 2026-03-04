import { useEffect, useRef } from 'react'
import { useFileUploader } from '../../hooks/useMultipartUpload';
import { useUploadManager } from '../../context/UploadContext';
import { useUser } from '../../context/UserContext';

type UploadItem = {
  id: string;
  file: File;
  evidenceNumber: string;
  description: string;
  progress: number;
  status: "uploading" | "paused" | "error" | "completed";
  isPaused: boolean;
  prefix: string;
  controller: {
    pause: () => void;
    resume: () => void;
    retry: () => void;
    cancel: () => void;
  };
};

const UploadWorker = ({item}: {item: UploadItem}) => {

    const startedRef = useRef(false);
    const { user_name } = useUser()

    console.log('itemmmm: ', item)
    const {
        uploadMutation,
        progress,
        pause,
        resume,
        cancelUpload,
        retryUpload,
        isPaused,
        isNetworkError,
        isCompleted
    } = useFileUploader();

    const { updateProgress, attachController, updateIsPausedStatus, updateStatus } = useUploadManager()
    console.log('uploadMutationnnnnn: ', uploadMutation)
    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        // if(item.status === 'uploading'){
            uploadMutation.mutateAsync({
                file: item.file,
                key: `${item.prefix}${item.file.name}`,
                // key: `private/us-east-1:b36012c8-c47f-c9b6-70f1-50eb0407d851/2027-0000002/${item.file.name}`,
                metadata: {
                    evidenceNumber: item.evidenceNumber,
                    description: item.description,
                    user_name: user_name,
                    case_number: `${item.prefix}${item.file.name}`.split("/")[2],
                },
            })
        // }
    }, []);


    useEffect(() => {
        updateProgress(item.id, progress)
    }, [progress])

    useEffect(() => {
        attachController(item.id, {
            pause,
            resume,
            retry: () => {
            //     uploadMutation.mutateAsync({
            //     file: item.file,
            //     key: `${item.prefix}${item.file.name}`,
            //     // key: `private/us-east-1:b36012c8-c47f-c9b6-70f1-50eb0407d851/2027-0000002/${item.file.name}`,
            //     metadata: {
            //         evidenceNumber: item.evidenceNumber,
            //         description: item.description,
            //         user_name: user_name,
            //         case_number: `${item.prefix}${item.file.name}`.split("/")[2],
            //     },
            // })
            retryUpload()
            updateStatus(item.id, 'uploading')
            },
            cancel: cancelUpload,
        })
    }, [])

    useEffect(() => {
        updateIsPausedStatus(item.id, isPaused)
        updateStatus(item.id, isPaused ? 'paused': 'uploading')
    },[isPaused])

    useEffect(() => {
        // updateIsPausedStatus(item.id, isPaused)
        if(isCompleted)
            updateStatus(item.id, 'completed')
    },[isCompleted])

    useEffect(() => {
        console.log('isNetworkErrorrrr: ', isNetworkError)
        if(isNetworkError)
            updateStatus(item.id, 'error')
    },[isNetworkError])
    

    // useEffect(() => {
        
    // })


    return null
}

export default UploadWorker
