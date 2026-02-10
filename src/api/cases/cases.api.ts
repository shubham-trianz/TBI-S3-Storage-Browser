import { apiClient } from "../client";
import {
  Case,
  CreateCasePayload,
  EvidenceListResponse
} from "./cases.types";

export const CasesAPI = {
  getAll(): Promise<Case[]> {
    return apiClient.get('/cases').then(res => res.data);
  },

  createCase(payload: CreateCasePayload): Promise<Case> {
    return apiClient.put('/cases', payload).then(res => res.data);
  },

  getCaseEvidence(
    caseNumber: string,
    cursor?: string
  ): Promise<EvidenceListResponse> {
    const params = cursor ? { cursor } : {};
    return apiClient
      .get(`/cases/${caseNumber}/evidence`, { params })
      .then(res => res.data);
  }
};
