import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, User as UserIcon, Shield, Eye, EyeOff, Mail, Key } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export default function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    is_admin: false,
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setCurrentUser(profile);

        if (!profile?.is_admin) {
          toast.error('Acesso negado: Apenas administradores podem gerenciar usuários.');
          navigate('/users');
          return;
        }
      }

      if (id) {
        const { data: userToEdit, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (userToEdit) {
          setFormData({
            name: userToEdit.name || '',
            email: userToEdit.email || '',
            is_admin: Boolean(userToEdit.is_admin),
            password: '',
            confirmPassword: ''
          });
        }
      }
    } catch (error: any) {
      toast.error('Erro ao carregar usuário: ' + error.message);
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (isAdmin: boolean) => {
    setFormData(prev => ({ ...prev, is_admin: isAdmin }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.is_admin) {
      return toast.error('Acesso negado: Apenas administradores podem salvar usuários.');
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            is_admin: formData.is_admin
          })
          .eq('id', id);
        if (error) throw error;
        toast.success('Usuário atualizado com sucesso!');
      } else {
        if (!formData.email.trim()) return toast.error('E-mail é obrigatório.');
        if (formData.password.length < 6) return toast.error('A senha deve ter no mínimo 6 caracteres.');
        if (formData.password !== formData.confirmPassword) return toast.error('As senhas não coincidem.');

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          await supabase.from('users').insert([{
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            is_admin: formData.is_admin
          }]);
        }
        toast.success('Novo usuário cadastrado com sucesso!');
      }
      navigate('/users');
    } catch (error: any) {
      toast.error('Erro ao salvar usuário: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando dados do usuário...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-slate-50 min-h-full space-y-4 md:space-y-5">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Superior com Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
              title="Voltar para Usuários"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditing ? 'Altere nome e nível de permissão' : 'Cadastre um novo operador no sistema ERP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-xl transition-colors shadow-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Usuário' : 'Salvar Usuário')}</span>
            </button>
          </div>
        </div>

        {/* Card: Dados Principais */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Credenciais & Perfil</h2>
              <p className="text-xs text-slate-500 mt-0.5">Identificação e acesso do usuário</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nome Completo *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
                placeholder="Ex: Carlos Oliveira"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                E-mail (Login) *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  disabled={isEditing}
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm transition-colors ${
                    isEditing ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                  }`}
                  placeholder="carlos@empresa.com"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            {/* Senhas (apenas na criação) */}
            {!isEditing && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors font-mono"
                      placeholder="••••••••"
                    />
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors font-mono"
                      placeholder="••••••••"
                    />
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card: Nível de Permissão */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Perfil de Permissão</h2>
              <p className="text-xs text-slate-500 mt-0.5">Defina os privilégios de acesso no ERP</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => handleRoleChange(false)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                !formData.is_admin
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${!formData.is_admin ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Operador / Vendedor</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Acesso a vendas, produtos e consultas</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => handleRoleChange(true)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.is_admin
                  ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${formData.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Administrador</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Acesso total a relatórios, configurações e usuários</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
