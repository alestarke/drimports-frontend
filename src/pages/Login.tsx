import { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Chamada nativa do Supabase para login
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 2. O Supabase não joga a requisição pro catch automaticamente se a senha estiver errada,
      // ele retorna um objeto de erro. Precisamos checar isso:
      if (supabaseError) {
        throw supabaseError;
      }

      // 3. Sucesso! O Supabase JÁ SALVOU o token no localStorage pra você automaticamente.
      console.log('Login realizado com sucesso. Usuário:', data.user?.email);
      
      // Se quiser salvar o nome do usuário para exibir na tela (caso tenha salvo nos metadados):
      // localStorage.setItem('userName', data.user?.user_metadata?.name || 'Admin');

      navigate('/dashboard');
      
    } catch (err: any) {
      console.error(err);
      setError('E-mail ou senha incorretos!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        
        <div className="bg-gray-900 p-4 flex items-center justify-center h-32 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="flex items-center cursor-default select-none relative z-10">
                <span className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    DR.
                </span>
                <span className="text-3xl font-medium tracking-[0.15em] text-white ml-2">
                    IMPORTS
                </span>
            </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

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
        
        <div className="px-8 py-4 bg-slate-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Dr. Imports Dashboard. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}