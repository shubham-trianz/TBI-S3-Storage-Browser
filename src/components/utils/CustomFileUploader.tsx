import { useState } from "react";
import { useFileUploader } from "../../hooks/useMultipartUpload";
import { Play, Pause } from "lucide-react";

export function CustomFileUploader() {
  const [file, setFile] = useState<File | null>(null);

  const {
    uploadMutation,
    progress,
    pause,
    resume,
    hasStoredUpload,
    isPaused,
  } = useFileUploader();

  const handleUpload = async () => {
    if (!file) return;

    await uploadMutation.mutateAsync({
      file,
      key: file.name,
      metadata: {},
    });
  };

  const togglePause = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  return (
    <div className="w-96 p-6 rounded-2xl shadow-lg bg-white border border-gray-200 space-y-4">
      <input
        type="file"
        className="block w-full text-sm"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {hasStoredUpload && (
        <div className="text-amber-600 text-sm">
          Resume previous upload available
        </div>
      )}

      {file && (
        <>
          {/* Progress Bar */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-sm text-gray-600">
                {isPaused ? "Paused" : `${progress}% uploaded`}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {!uploadMutation.isPending && (
              <button
                onClick={handleUpload}
                className="flex-1 bg-black text-white py-2 rounded-xl hover:opacity-90 transition"
              >
                Upload
              </button>
            )}

            {uploadMutation.isPending && (
              <button
                onClick={togglePause}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
              >
                {isPaused ? (
                  <>
                    <Play size={16} />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause size={16} />
                    Pause
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
