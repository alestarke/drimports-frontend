import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User as UserIcon, Mail, Lock, Shield, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export default function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    is_admin: false
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchUser(id);
    }
  }, [id, isEditing]);

  const fetchUser = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          password: '',
          is_admin: Boolean(data.is_admin)
        });
      }
    } catch (err: any) {
      toast.error('Erro ao carregar usuário: ' + err.message);
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Preencha o nome do usuário.');
    if (!formData.email.trim()) return toast.error('Preencha o e-mail do usuário.');

    setSaving(true);
    try {
      if (isEditing && id) {
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            email: formData.email,
            is_admin: formData.is_admin
          })
          .eq('id', id);

        if (error) throw error;
        toast.success('Usuário atualizado com sucesso!');
      } else {
        if (!formData.password || formData.password.length < 6) {
          setSaving(false);
          return toast.error('A senha deve ter pelo menos 6 caracteres.');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('users')
            .upsert([
              {
                id: authData.user.id,
                name: formData.name,
                email: formData.email,
                is_admin: formData.is_admin
              }
            ]);

          if (profileError) throw profileError;
        }

        toast.success('Usuário criado com sucesso!');
      }

      navigate('/users');
    } catch (err: any) {
      toast.error('Erro ao salvar usuário: ' + err.message);
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
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5">
        
        {/* Header Superior Apenas com Breadcrumb e Título */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="Voltar para Usuários"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Usuários</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isEditing ? 'Editar Acesso do Usuário' : 'Novo Usuário do Sistema'}
            </h1>
          </div>
        </div>

        {/* CARD ÚNICO CONSOLIDADO DO FORMULÁRIO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
          
          {/* Seção 1: Credenciais & Permissões */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <UserIcon size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Acesso & Permissões</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome do Usuário / Operador *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  placeholder="Ex: Carlos Silva"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  E-mail de Acesso *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                    placeholder="operador@empresa.com"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Senha Inicial (min. 6 caracteres) *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      required={!isEditing}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
              )}

              <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Privilégio de Administrador</p>
                    <p className="text-xs text-slate-500">Concede acesso total de gerenciamento de usuários e configurações</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_admin"
                    checked={formData.is_admin}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* RODAPÉ DO CARD COM AÇÕES À DIREITA */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-xl transition-colors shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Usuário' : 'Criar Usuário')}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
