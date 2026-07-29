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

  // GET /products/?skip=0&limit=10&search=...
  getProducts: async (skip = 0, limit = 10, search = null) => {
    const params = { skip, limit };
    if (search) params.search = search;
    const response = await api.get('/products/', { params });
    return response.data;
  },

  // GET /products/{product_id}
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // GET /products/sku/{sku_code}
  getProductBySku: async (sku) => {
    const response = await api.get(`/products/sku/${sku}`);
    return response.data;
  },

  // POST /products/
  createProduct: async (payload) => {
    // payload: { name, sku, category_id, price, stock_quantity }
    const response = await api.post('/products/', payload);
    return response.data;
  },

  // PUT /products/{product_id}
  updateProduct: async (id, payload) => {
    // payload: { name?, category_id?, price?, stock_quantity? }
    const response = await api.put(`/products/${id}`, payload);
    return response.data;
  },

  // DELETE /products/{product_id}
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // POST /products/transaction
  createTransaction: async (payload) => {
    const response = await api.post('/products/transaction', payload);
    return response.data;
  }
};

export const categoryService = {
  // GET /categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // POST /categories
  createCategory: async (payload) => {
    const response = await api.post('/categories', payload);
    return response.data;
  }
};

export default api;