const API_BASE = '';

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  
  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    
    if (res.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }

    // Try to parse JSON response
    let data = {};
    const contentType = res.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (e) {
        console.error('[apiFetch] Failed to parse JSON response:', e);
        data = { error: 'Server returned invalid response' };
      }
    } else {
      const text = await res.text();
      if (text) {
        console.error('[apiFetch] Non-JSON response:', text);
        data = { error: text || 'Server error' };
      } else {
        data = { error: 'Empty server response' };
      }
    }
    
    if (!res.ok) {
      throw { 
        status: res.status, 
        ...data,
        error: data.error || `HTTP ${res.status}: ${res.statusText}`
      };
    }
    
    return data;
  } catch (err) {
    console.error('[apiFetch] Request error:', err);
    throw err;
  }
}

export const api = {
  // Auth
  signup: (data) => apiFetch('/api/signup', { method: 'POST', body: data }),
  loginEmail: (data) => apiFetch('/auth/login-email', { method: 'POST', body: data }),
  loginFace: (data) => apiFetch('/auth/login-face', { method: 'POST', body: data }),
  logout: () => apiFetch('/api/user/logout', { method: 'POST' }),

  // Profile
  getProfile: () => apiFetch('/api/user/profile'),
  updateProfile: (data) => apiFetch('/api/user/update-profile', { method: 'POST', body: data }),
  resetPassword: (data) => apiFetch('/api/user/reset-password', { method: 'POST', body: data }),

  // Vault
  addPassword: (data) => apiFetch('/api/vault/add-password', { method: 'POST', body: data }),
  getPasswords: () => apiFetch('/api/vault/passwords'),
  viewPassword: (id) => apiFetch(`/api/vault/view-password/${id}`),
  updatePassword: (id, data) => apiFetch(`/api/vault/update-password/${id}`, { method: 'PUT', body: data }),
  deletePassword: (id) => apiFetch(`/api/vault/delete-password/${id}`, { method: 'DELETE' }),
  passwordCount: () => apiFetch('/api/vault/password-count'),

  // PDF Vault
  vaultList: () => apiFetch('/vault/list'),
  vaultUpload: (formData) => apiFetch('/vault/upload', { method: 'POST', body: formData }),
  vaultAccess: (id, data) => apiFetch(`/vault/access/${id}`, { method: 'POST', body: data }),
  vaultDelete: (id) => apiFetch(`/vault/delete/${id}`, { method: 'DELETE' }),
  vaultVerifyFace: (data) => apiFetch('/vault/verify-face', { method: 'POST', body: data }),

  // Audit
  getAuditLogs: () => apiFetch('/api/audit-logs'),
};
