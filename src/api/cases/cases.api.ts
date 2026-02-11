import { apiClient } from "../client";
// import { Case, CreateCasePayload, ShareCaseToPayload } from "./cases.types";
import {
  Case,
  CreateCasePayload,
  EvidenceListResponse,
  ShareCaseToPayload
} from "./cases.types";

export const CasesAPI = {
    getAll(): Promise<Case[]> {
        return apiClient.get('/cases').then(res => res.data)
    },
    createCase(payload: CreateCasePayload): Promise<Case> {
        return apiClient.put('/cases', payload).then(res => res.data)
    },
    shareCaseTo(payload: ShareCaseToPayload[]): Promise<void> {
        return apiClient.post('/share-case-to', payload).then(res => res.data)
    },
    getReceivedCaseByUser(userId: string): Promise<void> {
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
  }
}


// export const CasesAPI = {
//   getAll(): Promise<Case[]> {
//     return apiClient.get('/cases').then(res => res.data);
//   },

//   createCase(payload: CreateCasePayload): Promise<Case> {
//     return apiClient.put('/cases', payload).then(res => res.data);
//   },

//   getCaseEvidence(
//     caseNumber: string,
//     cursor?: string
//   ): Promise<EvidenceListResponse> {
//     const params = cursor ? { cursor } : {};
//     return apiClient
//       .get(`/cases/${caseNumber}/evidence`, { params })
//       .then(res => res.data);
//   }
// };
