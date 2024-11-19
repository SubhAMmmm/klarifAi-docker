import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api', // Your Django backend URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Export services
export const documentService = {
  uploadDocument: (formData) => {
    return axiosInstance.post('/upload-documents/', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      }
    });
  },

  getUserDocuments: () => {
    return axiosInstance.get('/user-documents/');
  },

  getChatHistory: () => {
    return axiosInstance.get('/chat-history/');
  }
};

export const chatService = {
  sendMessage: (message) => {
    return axiosInstance.post('/chat/', { message });
  },

  startConversation: (documentId, message) => {
    return axiosInstance.post('/conversation/start/', {
      document_id: documentId,
      message: message
    });
  },

  continueConversation: (conversationId, message) => {
    return axiosInstance.post('/conversation/continue/', {
      conversation_id: conversationId,
      message: message
    });
  }
};

export default axiosInstance;