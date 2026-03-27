import { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Plus, Shield, ShieldAlert, User as UserIcon, Loader2, Mail, Save, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// --- INTERFACES ---
interface SystemUser {
  id: string; 
  name: string;
  email: string;
  is_admin: boolean;
  created_at?: string;
  deleted_at?: string | null;
}

export default function Users() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- SEGURANÇA: Identifica o usuário logado atualmente ---
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  
  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado para visualização da senha
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    is_admin: false,
    password: '',
    confirmPassword: ''
  });

  // --- BUSCA INICIAL ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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
      }

      await fetchUsers();
    } catch (error: any) {
      toast.error('Erro na autenticação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message);
    }
  };

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (isAdmin: boolean) => {
    setFormData(prev => ({ ...prev, is_admin: isAdmin }));
  };

  const handleEdit = (user: SystemUser) => {
    if (!currentUser?.is_admin) return toast.error('Apenas admins podem editar usuários.');

    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      is_admin: user.is_admin || false,
      password: '',
      confirmPassword: ''
    });
    setShowPassword(false); 
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', is_admin: false, password: '', confirmPassword: '' });
    setShowPassword(false); 
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !currentUser.is_admin) {
      return toast.error('Acesso negado: Apenas administradores podem realizar esta ação.');
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        is_admin: formData.is_admin
      };

      if (editingId) {
        const { error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Permissões do usuário atualizadas!');
      } else {
        if (formData.password.length < 6) {
          setSaving(false);
          return toast.error('A senha deve ter no mínimo 6 caracteres.');
        }
        if (formData.password !== formData.confirmPassword) {
          setSaving(false);
          return toast.error('As senhas não coincidem.');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert([{ 
              id: authData.user.id,
              ...payload,
              email: formData.email
            }]);

          if (profileError) throw profileError;
        }

        toast.success('Usuário criado com credenciais de acesso!');
      }

      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!currentUser?.is_admin) return toast.error('Acesso negado.');

    if (id === currentUser.id) {
      return toast.error('Você não pode remover seu próprio acesso por aqui.');
    }

    const result = await Swal.fire({
      title: 'Remover acesso?',
      text: `O usuário ${name} perderá acesso ao sistema imediatamente.`,
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#3085d6',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, remover acesso'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);
          
        if (error) throw error;
        
        setUsers(prev => prev.filter(u => u.id !== id));
        toast.success('Usuário removido do sistema.');
      } catch (error: any) {
        toast.error('Erro ao excluir: ' + error.message);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Equipe e Acessos</h1>
          <p className="text-gray-500">Gerencie quem pode visualizar e alterar dados no sistema.</p>
        </div>
        {currentUser?.is_admin && (
          <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20 active:scale-95">
            <Plus size={20} /> Novo Usuário
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Resultados */}
      {loading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Usuário</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nível de Acesso</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Data de Entrada</th>
                    {currentUser?.is_admin && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${user.is_admin ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{user.name} {user.id === currentUser?.id && <span className="text-xs text-blue-500 font-normal ml-1">(Você)</span>}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12}/> {user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit border border-indigo-200">
                            <ShieldAlert size={14} /> Administrador
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit border border-gray-200">
                            <UserIcon size={14} /> Padrão
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '--'}
                      </td>
                      {currentUser?.is_admin && (
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleEdit(user)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors" title="Editar Permissões">
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id, user.name)} 
                            className={`p-1 transition-colors ${user.id === currentUser?.id ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-red-600'}`} 
                            title="Remover Acesso"
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && <tr><td colSpan={currentUser?.is_admin ? 4 : 3} className="px-6 py-12 text-center text-gray-500 italic">Nenhum usuário encontrado.</td></tr>}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE USUÁRIO */}
      {currentUser?.is_admin && (
        <Modal title={editingId ? "Editar Permissões" : "Adicionar Novo Usuário"} isOpen={isModalOpen} onClose={handleCloseModal} maxWidth="max-w-lg">
          <form onSubmit={handleSave} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Acesso</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!!editingId} className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`} required />
              {editingId && <p className="text-xs text-gray-400 mt-1">O e-mail de login não pode ser alterado após a criação.</p>}
            </div>

            {!editingId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                      minLength={6} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="confirmPassword" 
                      value={formData.confirmPassword} 
                      onChange={handleInputChange} 
                      className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                      minLength={6} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
              <label className="block text-sm font-bold text-gray-800 mb-2 items-center gap-2"><Shield size={16}/> Nível de Acesso</label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    checked={!formData.is_admin} 
                    onChange={() => handleRoleChange(false)} 
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-600" 
                  />
                  <div>
                    <p className="font-medium text-gray-900">Usuário Padrão</p>
                    <p className="text-xs text-gray-500">Pode registrar vendas, importar produtos e ver o dashboard, mas não pode gerenciar usuários.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    checked={formData.is_admin} 
                    onChange={() => handleRoleChange(true)} 
                    className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-600" 
                  />
                  <div>
                    <p className="font-medium text-indigo-900">Administrador</p>
                    <p className="text-xs text-gray-500">Acesso total ao sistema. Pode excluir histórico e adicionar/remover membros da equipe.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
              <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-70 shadow-md shadow-blue-600/20">
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Salvando...' : editingId ? 'Atualizar Acesso' : 'Adicionar Usuário'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}