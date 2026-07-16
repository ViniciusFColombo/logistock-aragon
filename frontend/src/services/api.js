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

  // Retrieves the flow prediction and current status for the table.
  getStockRunway: async () => {
    const response = await api.get('/products/stock-runway');
    return response.data;
  },

  // Sends the user's question or the input from quick-reply buttons to the back-end AI.
  askAgent: async (userQuery) => {
    const response = await api.post('/agent/ask', { query: userQuery });
    return response.data; // Retorn {"status": "success", "agent_response": "..."}
  }
};

export default api;