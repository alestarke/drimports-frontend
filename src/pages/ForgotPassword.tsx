import { useState } from 'react';
import { Mail, ArrowLeft, Loader2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Solicitar ao Supabase um e-mail de recuperação
      // Ele retornará um link mágico que redirecionará o usuário para /reset-password
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (supabaseError) throw supabaseError;
      
      setSuccess('Instruções de redefinição enviadas! Verifique sua caixa de entrada.');
      setEmail('');
    } catch (err: any) {
      console.error(err);
      setError('Ocorreu um erro ao tentar recuperar sua senha. Verifique o e-mail ou tente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Cabeçalho Visual da Marca */}
        <div className="bg-gray-900 p-4 flex items-center justify-center h-32 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
            
             <div className="flex flex-col items-center cursor-default select-none relative z-10">
                 <div className="flex items-center">
                    <span className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                        DR.
                    </span>
                    <span className="text-3xl font-medium tracking-[0.15em] text-white ml-2">
                        IMPORTS
                    </span>
                 </div>
                 <span className="text-blue-400 text-sm mt-1 tracking-widest uppercase">
                    Recuperar Senha
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

            {success && (
              <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                {success}
              </div>
            )}

            <div className="text-sm text-gray-600 text-center pb-2">
                Esqueceu sua senha? Não se preocupe! Digite seu e-mail abaixo e enviaremos um link de acesso seguro para você redefini-la.
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">E-mail de Cadastro</label>
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

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Link de Recuperação
                  <Send className="h-5 w-5" />
                </>
              )}
            </button>
            
            <div className="flex justify-center pt-2">
                <Link to="/login" className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar para o Login
                </Link>
            </div>
          </form>
        </div>
        
      </div>
    </div>
  );
}
