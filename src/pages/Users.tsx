import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Edit, Plus, Shield, User as UserIcon, Loader2, Mail } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface SystemUser {
  id: string; 
  name: string;
  email: string;
  is_admin: boolean;
  created_at?: string;
  deleted_at?: string | null;
}

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);

  // PAGINAÇÃO COMPACTA
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  const handleDelete = async (userToDelete: SystemUser) => {
    if (!currentUser?.is_admin) return toast.error('Apenas admins podem excluir usuários.');
    if (userToDelete.id === currentUser.id) return toast.error('Você não pode excluir seu próprio usuário.');

    const result = await Swal.fire({
      title: 'Remover acesso?',
      text: `O usuário ${userToDelete.name} perderá o acesso ao sistema.`,
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, desativar'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', userToDelete.id);

        if (error) throw error;
        
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        toast.success('Acesso desativado!');
      } catch (error: any) {
        toast.error('Erro ao desativar: ' + error.message);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-slate-50 h-full flex flex-col justify-between overflow-hidden space-y-3.5">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-none">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Usuários do Sistema</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Gerencie operadores e administradores com acesso ao ERP</p>
        </div>

        {currentUser?.is_admin && (
          <button 
            onClick={() => navigate('/users/new')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs active:scale-95"
          >
            <Plus size={18} /> Novo Usuário
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs flex gap-4 flex-none">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex flex-col justify-center items-center flex-1 gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
          <p className="text-sm text-slate-500">Carregando usuários...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 justify-between">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/90 backdrop-blur-xs border-b border-slate-100 text-slate-500 font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3">Usuário</th>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Perfil de Acesso</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${
                          user.is_admin 
                            ? 'bg-purple-50 text-purple-600 border-purple-100' 
                            : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {user.is_admin ? <Shield size={18} /> : <UserIcon size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 flex items-center gap-2">
                            {user.name}
                            {user.id === currentUser?.id && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">Você</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-slate-600 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        user.is_admin 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {user.is_admin ? 'Administrador' : 'Operador'}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      {currentUser?.is_admin && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => navigate(`/users/edit/${user.id}`)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button 
                              onClick={() => handleDelete(user)} 
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-3 px-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-none text-xs text-slate-500">
              <span>
                Página {currentPage} de {totalPages} ({filteredUsers.length} usuários)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}