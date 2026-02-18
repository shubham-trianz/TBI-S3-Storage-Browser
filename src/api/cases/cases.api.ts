import { apiClient } from "../client";
import {
  Case,
  CreateCasePayload,
  EvidenceListResponse,
  ShareCaseToPayload,
  ShareExternalPayload,
  ReceivedCase
} from "./cases.types";

export const CasesAPI = {
    // Get all cases created by logged in user
    getAll(): Promise<Case[]> {
      return apiClient.get('/cases').then(res => res.data)
    },
    // Create a case
    createCase(payload: CreateCasePayload): Promise<Case> {
      return apiClient.put('/cases', payload).then(res => res.data)
    },
    // Share case to other user
    shareCaseTo(payload: ShareCaseToPayload[]): Promise<void> {
      return apiClient.post('/share-case-to', payload).then(res => res.data)
    },
    // Share case to external users
    shareExternal(payload: ShareExternalPayload): Promise<void> {
      return apiClient.post('/share-external', payload).then(res => res.data);
    },
    // 
    getReceivedCaseByUser(userId: string): Promise<ReceivedCase> {
      return apiClient.get('/get-received-case', {params: {
          user_id: userId
      }}).then(res => res.data)
    },
    getCaseEvidence(
    caseNumber: string,
    cursor?: string
  ): Promise<EvidenceListResponse> {
    const params = cursor ? { cursor } : {};
    return apiClient
      .get(`/cases/${caseNumber}/evidence`, { params })
      .then(res => res.data);
  },
  deleteEvidence(
  caseNumber: string,
  objectKeys: string[]
): Promise<void> {
  return apiClient
    .delete(`/cases/${caseNumber}/evidence`, {
      data: { objectKeys } 
    })
    .then(res => res.data);
},
}