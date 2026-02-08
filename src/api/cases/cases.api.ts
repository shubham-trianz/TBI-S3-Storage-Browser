import { apiClient } from "../client";
import { Case, CreateCasePayload } from "./cases.types";

export const CasesAPI = {
    getAll(): Promise<Case[]> {
        return apiClient.get('/cases').then(res => res.data)
    },
    createCase(payload: CreateCasePayload): Promise<Case> {
        return apiClient.put('/cases', payload).then(res => res.data)
    }
}

