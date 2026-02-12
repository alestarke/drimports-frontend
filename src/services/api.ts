import axios from 'axios';
import toast from 'react-hot-toast';

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

// INTERCEPTADOR DE RESPOSTA
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 1. Pega a mensagem de erro que vem do Laravel
        // O Laravel costuma mandar em: error.response.data.message
        const errorMessage = error.response?.data?.message || 'Ocorreu um erro inesperado.';
        
        // 2. Verifica o status
        if (error.response) {
            const status = error.response.status;

            if (status === 401) {
                toast.error('Sessão expirada. Faça login novamente.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userName');
                window.location.href = '/login';
            } 
            else if (status === 403) {
                toast.error('Você não tem permissão para esta ação.');
            }
            else if (status === 422) {
                toast.error(errorMessage); 
            }
            else if (status >= 500) {
                toast.error('Erro no Servidor. Tente mais tarde.');
            }
            else {
                // Outros erros
                toast.error(errorMessage);
            }
        } else {
            // Erro de rede (API desligada)
            toast.error('Erro de conexão. Verifique sua internet ou se a API está rodando.');
        }

        return Promise.reject(error);
    }
);

export default api;