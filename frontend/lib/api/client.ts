export class APIError extends Error {
  public code: string;
  public details: Record<string, any>;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details: Record<string, any> = {}) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
  }
}

export class APIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Set default headers
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new APIError(`HTTP Error ${response.status}: ${response.statusText}`, 'HTTP_ERROR');
        }
        
        if (errorData?.error) {
          throw new APIError(
            errorData.error.message || 'An API error occurred',
            errorData.error.code || 'API_ERROR',
            errorData.error.details || {}
          );
        } else {
          throw new APIError(`HTTP Error ${response.status}: ${response.statusText}`, 'HTTP_ERROR', errorData);
        }
      }

      // 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error instanceof Error ? error.message : 'Network request failed',
        'NETWORK_ERROR'
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new APIClient();
