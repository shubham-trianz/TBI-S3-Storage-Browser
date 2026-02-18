import axios from 'axios'

// Centralized Axios client configured with base URL, timeout, and default headers
// for all backend API request.
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});