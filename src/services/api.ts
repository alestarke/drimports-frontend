import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:7000/api',
});

// INTERCEPTADOR DE REQUISIÇÃO
// Antes de qualquer chamada sair do front, ele "cola" o token
api.interceptors.request.use((config) => {
    // 1. Busca o token que gravamos no LocalStorage durante o Login
    const token = localStorage.getItem('authToken');

    // 2. Se tiver token, adiciona no cabeçalho Authorization
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// INTERCEPTADOR DE RESPOSTA (Opcional, mas recomendado)
// Se o token vencer (Erro 401), desloga o usuário
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            // Força o redirecionamento para login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;