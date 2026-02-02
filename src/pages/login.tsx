import { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  // --- STATE (Estado) ---
  // Hooks: O React "reage" quando estas variáveis mudam
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
      // Aqui entraria a chamada para o seu backend Laravel
      const response = await axios.post('http://localhost:7000/api/login', {
        email,
        password
      });
      console.log('Login realizado com sucesso:', response.data);
      navigate('/dashboard');
    } catch (err) {
      setError('E-mail ou senha incorretos!');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER (JSX) ---
  return (
    // Container Principal: Fundo gradiente suave
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      
      {/* O Card Branco */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Cabeçalho do Card */}
        <div className="bg-gray-300 p-4 flex items-center justify-center h-32">
            <img 
              src="/escrita-logo-dr.png" 
              alt="Dr. Imports Logo" 
              className="h-full w-auto object-contain"
            />
        </div>

        {/* Corpo do Formulário */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Exibição de Erro (Similar ao *ngIf) */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Input de Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <div className="relative">
                {/* Ícone posicionado absolutamente dentro do input */}
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Input de Senha */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-700 hover:underline">
                  Esqueceu?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Botão de Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-600/30"
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
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            © 2026 Dr. Imports Dashboard. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}