
import { API_CONFIG, HTTP_STATUS } from './config.js';

class HttpClient {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.retries = API_CONFIG.retries;
    this.retryDelay = API_CONFIG.retryDelay;
    this.defaultHeaders = API_CONFIG.headers;
    
    
    console.log('HttpClient initialized:', { baseURL: this.baseURL, timeout: this.timeout, environment: import.meta.env.MODE });
  }

  
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = { ...this.defaultHeaders };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  
  async requestWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  
  async requestWithRetry(url, options, maxRetries = this.retries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.requestWithTimeout(url, options, this.timeout);
        
        
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }
        
        
        if (attempt === maxRetries) {
          return response;
        }
        
      } catch (error) {
        lastError = error;
        
        
        if (error.message === 'Request timeout' && attempt === maxRetries) {
          throw error;
        }
        
        
        if (attempt < maxRetries) {
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  
  async processResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          data,
          message: data.message || data.error || 'Request failed'
        };
      }
      
      return data;
    }
    
    if (!response.ok) {
      throw {
        status: response.status,
        statusText: response.statusText,
        message: 'Request failed'
      };
    }
    
    return response.text();
  }

  
  buildUrl(endpoint, params = null) {
    
    const fullUrl = this.baseURL + endpoint;
    
    
    console.log('Building URL:', {
      endpoint,
      baseURL: this.baseURL,
      fullURL: fullUrl
    });
    
    
    const url = new URL(fullUrl);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
    }

    return url.toString();
  }  
  async get(endpoint, params = null, options = {}) {
    const url = this.buildUrl(endpoint, params);
    const requestOptions = {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await this.requestWithRetry(url, requestOptions);
      return await this.processResponse(response);
    } catch (error) {
      console.error('GET Request failed:', error);
      throw error;
    }
  }

  
  async post(endpoint, data = null, options = {}) {
    const url = this.buildUrl(endpoint);
    const requestOptions = {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      },
      body: data ? JSON.stringify(data) : null
    };

    try {
      const response = await this.requestWithRetry(url, requestOptions);
      return await this.processResponse(response);
    } catch (error) {
      console.error('POST Request failed:', error);
      throw error;
    }
  }

  
  async put(endpoint, data = null, options = {}) {
    const url = this.buildUrl(endpoint);
    const requestOptions = {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      },
      body: data ? JSON.stringify(data) : null
    };

    try {
      const response = await this.requestWithRetry(url, requestOptions);
      return await this.processResponse(response);
    } catch (error) {
      console.error('PUT Request failed:', error);
      throw error;
    }
  }

  
  async delete(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const requestOptions = {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await this.requestWithRetry(url, requestOptions);
      return await this.processResponse(response);
    } catch (error) {
      console.error('DELETE Request failed:', error);
      throw error;
    }
  }

  
  async patch(endpoint, data = null, options = {}) {
    const url = this.buildUrl(endpoint);
    const requestOptions = {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      },
      body: data ? JSON.stringify(data) : null
    };

    try {
      const response = await this.requestWithRetry(url, requestOptions);
      return await this.processResponse(response);
    } catch (error) {
      console.error('PATCH Request failed:', error);
      throw error;
    }
  }
}


export const httpClient = new HttpClient();
export default httpClient;
