const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiRequestInit extends RequestInit {
    token?: string;
}

async function apiRequest<T>(
    endpoint: string,
    options: ApiRequestInit = {}
): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Generic methods
    async get<T>(url: string, params: Record<string, any> = {}, token?: string) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        // Prefix with /api/v1 if not present
        const endpoint = fullUrl.startsWith('/api/') ? fullUrl : `/api/v1${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
        return { data: await apiRequest<T>(endpoint, { token }) };
    },

    async post<T>(url: string, data: any, token?: string) {
        const endpoint = url.startsWith('/api/') ? url : `/api/v1${url.startsWith('/') ? '' : '/'}${url}`;
        return {
            data: await apiRequest<T>(endpoint, {
                method: 'POST',
                body: JSON.stringify(data),
                token
            })
        };
    },

    // Auth
    async getProfile(token: string) {
        return apiRequest('/api/v1/users/profile', { token });
    },

    async getWallet(token: string) {
        return apiRequest<{ credits: number; user_id: string }>('/api/v1/users/wallet', { token });
    },

    // Projects
    async getProjects(token: string) {
        return apiRequest('/api/v1/projects', { token });
    },

    async getProject(projectId: string, token: string) {
        return apiRequest(`/api/v1/projects/${projectId}`, { token });
    },

    async createProject(data: any, token: string) {
        return apiRequest('/api/v1/projects', {
            method: 'POST',
            body: JSON.stringify(data),
            token,
        });
    },

    async getProjectAudio(projectId: string, token: string) {
        return apiRequest(`/api/v1/projects/${projectId}/audio`, { token });
    },

    // Generation
    async startGeneration(data: any, token: string) {
        return apiRequest('/api/v1/generate', {
            method: 'POST',
            body: JSON.stringify(data),
            token,
        });
    },

    async getGenerationJob(jobId: string, token: string) {
        return apiRequest(`/api/v1/generate/jobs/${jobId}`, { token });
    },

    // Styles
    async getStyles() {
        return apiRequest('/api/v1/styles');
    },

    async getStyle(styleId: string) {
        return apiRequest(`/api/v1/styles/${styleId}`);
    },

    // Transactions / History
    async getTransactions(token: string) {
        return apiRequest('/api/v1/users/transactions', { token });
    },
};
