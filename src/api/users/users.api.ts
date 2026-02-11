import { apiClient } from "../client";
import { User } from "./users.types";

export const UsersAPI = {
    getAll(): Promise<User[]> {
        return apiClient.get('/cognito-users').then(res => res.data)
    },

}

