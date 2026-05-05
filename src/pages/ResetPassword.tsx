import { useState, useEffect } from 'react';
import { Lock, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Quando o usuário clicar no link do e-mail, a alteração de hash da URL
  // permite que o Supabase estabeleça uma sessão automática de recuperação.
  // Assim, podemos simplesmente chamar updateUser para redefinir a senha do usuário autenticado nessa "sessão mágica".

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // A sessão aqui é reestabelecida apenas para troca de senha
          console.log("Sessão de recuperação ativada", session);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Tente novamente.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: supabaseError } = await supabase.auth.updateUser({
        password: password
      });

      if (supabaseError) throw supabaseError;
      
      setSuccess('Sua senha foi redefinida com sucesso!');
      
      // Delay pequeno para o feedback visual de sucesso
      setTimeout(() => {
        // Encerramos a sessão recuperada e pedimos para o usuário logar oficialmente.
        supabase.auth.signOut().then(() => {
            navigate('/login');
        });
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError('Erro ao atualizar a senha. A sua tentativa pode ter expirado ou havido um erro inesperado.');
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
                    Nova Senha
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

            {success ? (
              <div className="flex flex-col items-center text-center space-y-3 pb-4">
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                  <div className="p-3 text-base text-emerald-700 font-medium">
                    {success}
                  </div>
                  <span className="text-sm text-gray-500">Redirecionando para o login...</span>
              </div>
            ) : (
                <>
                <div className="text-sm text-gray-600 text-center pb-2">
                    Escolha uma nova senha para acessar sua conta. Certifique-se de que a senha contenha no mínimo 6 caracteres.
                </div>

                <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nova Senha</label>
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
                </div>

                <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    />
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
                    Processando...
                    </>
                ) : (
                    <>
                    Atualizar Senha
                    <KeyRound className="h-5 w-5" />
                    </>
                )}
                </button>
              </>
            )}
            
          </form>
        </div>
        
      </div>
    </div>
  );
}
