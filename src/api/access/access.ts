import { apiClient } from "../client";

export const AccessResolveAPI = {
    // Resolves the user's access level for a given generated link used in the Kaseware system
    resolveCase(caseId: string): Promise<{ access: "owner" | "shared" | "denied", case_number: string }> {
    return apiClient
        .get(`/cases/resolve-access?caseId=${caseId}`)
        .then(res => res.data);
    }
}



