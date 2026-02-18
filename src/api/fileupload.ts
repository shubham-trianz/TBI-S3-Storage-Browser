import { apiClient } from "./client";

export interface InitiateUploadResponse {
  uploadId: string;
  key: string;
  metadata?: Record<string, string>;
}

export interface PresignPart {
  partNumber: number;
  url: string;
}

export interface PresignUploadResponse {
  urls: PresignPart[];
}

export interface CompleteUploadPayload {
  uploadId: string;
  key: string;
  parts: { PartNumber: number; ETag: string }[];
}

export const FileUploadAPI = {
  // Initiate Multipart Upload
  initiate(fileName: string, contentType: string, metadata?: Record<string, string>): Promise<InitiateUploadResponse> {
    return apiClient
      .post("/uploads/initiate", { fileName, contentType, metadata })
      .then(res => res.data);
  },

  // Generate Presigned URLs for parts
  presign(uploadId: string, key: string, partNumbers: number[]): Promise<PresignUploadResponse> {
    return apiClient
      .post("/uploads/presign", { uploadId, key, partNumbers })
      .then(res => res.data);
  },

  // Complete Upload
  complete(payload: CompleteUploadPayload): Promise<{ location: string }> {
    return apiClient
      .post("/uploads/complete", payload)
      .then(res => res.data);
  },

  // List uploaded parts (for resume)
  listParts(uploadId: string, key: string): Promise<{ uploadedParts: { PartNumber: number; ETag: string }[] }> {
    return apiClient
      .post("/uploads/list-parts", { uploadId, key })
      .then(res => res.data);
  },

  // Abort upload
  abort(uploadId: string, key: string): Promise<{ aborted: boolean }> {
    return apiClient
      .post("/uploads/abort", { uploadId, key })
      .then(res => res.data);
  }
};
