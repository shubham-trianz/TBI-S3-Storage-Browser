import { apiClient } from "../client";
import { User } from "./users.types";

export const UsersAPI = {
    // Get all the cognito users
    getAll(): Promise<User[]> {
        return apiClient.get('/cognito-users').then(res => res.data)
    },

}

