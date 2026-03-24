import { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast'; // Descomente se for usar o Toaster aqui também
import axios from 'axios';

export default function Login() {
  // --- STATE (Estado) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- HANDLERS (Funções) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000/api';
      const response = await axios.post(`${apiUrl}/login`, {
        email,
        password
      });

      const {token, user} = response.data;

      if (token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userName', user.name);
      }

      console.log('Login realizado com sucesso:', response.data);
      navigate('/dashboard');
    } catch (err) {
      setError('E-mail ou senha incorretos!');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Container Principal: Fundo levemente azulado/acinzentado para destacar o card
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      
      {/* O Card Branco */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Cabeçalho do Card (Fundo escuro para a logo brilhar) */}
        <div className="bg-gray-900 p-4 flex items-center justify-center h-32 relative overflow-hidden">
            {/* Efeito de brilho sutil no fundo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
            
            {/* Nova Logo Tipográfica (Maior para a tela de login) */}
            <div className="flex items-center cursor-default select-none relative z-10">
                <span className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    DR.
                </span>
                <span className="text-3xl font-medium tracking-[0.15em] text-white ml-2">
                    IMPORTS
                </span>
            </div>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Exibição de Erro */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Input de Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Input de Senha */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-1">
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            {/* Botão de Submit (Agora Azul) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Entrando...
                </>
              ) : (
                <>
                  Acessar Sistema
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Rodapé do Card */}
        <div className="px-8 py-4 bg-slate-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Dr. Imports Dashboard. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}