import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-42477fe7`;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  };
  
  const token = getAuthToken();
  if (token) {
    headers['X-Session-Token'] = token;
    console.log('Using session token:', token.substring(0, 10) + '...');
  } else {
    console.log('No session token');
  }
  
  return headers;
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    console.log('Login API call for:', email);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('Login response status:', response.status);
    const data = await response.json();
    console.log('Login response data:', data.success ? 'Success' : 'Failed');
    
    if (data.success && data.token) {
      console.log('Setting auth token:', data.token.substring(0, 10) + '...');
      setAuthToken(data.token);
    }
    
    return data;
  },
  
  logout: async () => {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    
    setAuthToken(null);
    return response.json();
  },
};

// Products API
export const productsAPI = {
  getAll: async () => {
    console.log('Fetching products from API...');
    const response = await fetch(`${API_URL}/products`, {
      headers: getHeaders(),
    });
    
    console.log('Products API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Products API error:', errorData);
      throw new Error(errorData.error || 'Error al obtener productos');
    }
    
    const data = await response.json();
    console.log('Products received:', data.products?.length || 0);
    return data;
  },
  
  create: async (product: any) => {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      throw new Error('Error al crear producto');
    }
    
    return response.json();
  },
  
  update: async (id: string, product: any) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar producto');
    }
    
    return response.json();
  },
  
  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar producto');
    }
    
    return response.json();
  },
};

// Batches API
export const batchesAPI = {
  getAll: async () => {
    console.log('Fetching batches from API...');
    const response = await fetch(`${API_URL}/batches`, {
      headers: getHeaders(),
    });
    
    console.log('Batches API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Batches API error:', errorData);
      throw new Error(errorData.error || 'Error al obtener lotes');
    }
    
    const data = await response.json();
    console.log('Batches received:', data.batches?.length || 0);
    return data;
  },
  
  create: async (batch: any) => {
    const response = await fetch(`${API_URL}/batches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(batch),
    });
    
    if (!response.ok) {
      throw new Error('Error al crear lote');
    }
    
    return response.json();
  },
  
  update: async (id: string, batch: any) => {
    const response = await fetch(`${API_URL}/batches/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(batch),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar lote');
    }
    
    return response.json();
  },
  
  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/batches/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar lote');
    }
    
    return response.json();
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/users`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }
    
    return response.json();
  },
  
  create: async (user: any) => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user),
    });
    
    if (!response.ok) {
      throw new Error('Error al crear usuario');
    }
    
    return response.json();
  },
  
  update: async (id: string, user: any) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(user),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar usuario');
    }
    
    return response.json();
  },
  
  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar usuario');
    }
    
    return response.json();
  },
};
