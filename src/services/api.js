// Centralizovaná API komunikácia
// Vite dev server proxies /index.php requests to vaii_backend
const API_BASE = '/index.php';

const api = async (path, data = {}, method = 'POST') => {
  try {
    // Kontrola autentifikácie pre admin endpoints
    if (path.startsWith('/admin')) {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        return { 
          success: false, 
          message: 'Not authenticated - Please login as admin',
          data: null 
        };
      }
    }
    
    // Postaviť URL s path parametrom
    const url = `${API_BASE}?path=${encodeURIComponent(path)}`;
    
    const options = {
      method: method,
      mode: 'cors',
      credentials: 'include',  // Poslať cookies (sessions)
      headers: { 'Content-Type': 'application/json' },
    };
    
    // Ak ide na admin endpoint, poslať token v headers
    if (path.startsWith('/admin')) {
      const token = localStorage.getItem('adminToken');
      if (token) {
        options.headers['X-Admin-Token'] = token;
      }
    }
    
    if (['POST', 'PUT', 'DELETE'].includes(method) && Object.keys(data).length > 0) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Network error: ' + error.message, data: null };
  }
};

// Pomocné funkcie
const apiGet = (path) => api(path, {}, 'GET');
const apiPost = (path, data) => api(path, data, 'POST');
const apiPut = (path, data) => api(path, data, 'PUT');

// Autentifikácia
export const adminLogin = (username, password) => apiPost('/auth/admin-login', { username, password });
export const userLogin = (orderCode) => apiPost('/auth/user-login', { orderCode });
export const adminLogout = () => apiPost('/auth/admin-logout', {});

// Objednávky
export const createOrder = (orderData) => apiPost('/orders/create', orderData);
export const getOrders = () => apiGet('/orders');
export const getOrder = (id) => apiGet(`/orders/${id}`);
export const updateOrderStatus = (id, status) => apiPut(`/orders/${id}/status`, { status });

// Admin endpoints
export const adminGetOrders = () => apiGet('/admin/orders');
export const adminGetOrderDetails = (id) => apiGet(`/admin/orders/${id}`);
export const adminUpdateOrderStatus = (id, status) => apiPut(`/admin/orders/${id}/status`, { status });
export const adminUpdatePrice = (id, price) => apiPut(`/admin/orders/${id}/price`, { agreed_price: price });
export const adminGetStats = () => apiGet('/admin/stats');

// Súbory
export const getUploadedFiles = (token) => apiGet(`/orders/${token}/files`);
export const downloadFile = (token, fileName) => {
  // Direct download - nie cez JSON API
  const url = `/index.php?path=${encodeURIComponent(`/orders/${token}/download/${fileName}`)}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Recenzie
export const createReview = (reviewData) => apiPost('/reviews', reviewData);
export const getPublishedReviews = () => apiGet('/reviews');
export const getReviewsByOrderId = (orderId) => apiGet(`/reviews/order/${orderId}`);

