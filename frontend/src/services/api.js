import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const inventoryService = {
  getDashboardSummary: async () => {
    const response = await api.get('/products/dashboard/summary');
    return response.data;
  },

  getStockRunway: async () => {
    const response = await api.get('/products/stock-runway');
    return response.data;
  },

  askAgent: async (userQuery) => {
    const response = await api.post('/agent/ask', { query: userQuery });
    return response.data;
  },

  getMovements: async (skip = 0, limit = 10) => {
    const response = await api.get('/products/movements/all', {
      params: { skip, limit }
    });
    return response.data;
  },

  // Search Methods for the Form
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getProductBySku: async (sku) => {
    const response = await api.get(`/products/sku/${sku}`);
    return response.data;
  },

  createTransaction: async (payload) => {
    // payload: { product_id: int, quantity: int, movement_type: "in" | "out" }
    const response = await api.post('/products/transaction', payload);
    return response.data;
  }

};

export default api;