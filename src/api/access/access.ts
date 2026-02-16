import { apiClient } from "../client";

export const AccessResolveAPI = {
    resolveCase(caseId: string): Promise<{ access: "owner" | "shared" | "denied", case_number: string }> {
    return apiClient
        .get(`/cases/resolve-access?caseId=${caseId}`)
        .then(res => res.data);
    }
}



