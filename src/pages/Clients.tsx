import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Save, User, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
}

export default function Clients() {
  // --- ESTADOS ---
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal e Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: ''
  });

  // --- BUSCA INICIAL ---
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data?.data  || []); 
    } catch (error) {
      console.error(error);

      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      document: client.document || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "Isso removerá o cliente do sistema.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/clients/${id}`);
        setClients(prev => prev.filter(c => c.id !== id));
        toast.success('Cliente excluído com sucesso!');
      } catch (error) {

      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
        toast.success('Cliente atualizado!');
      } else {
        await api.post('/clients', formData);
        toast.success('Cliente cadastrado!');
      }

      handleCloseModal();
      fetchClients();
    } catch (error: any) {
      console.error(error);

    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', document: '' });
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
            <p className="text-gray-500">Gerencie sua carteira de compradores</p>
        </div>
        <button 
            onClick={() => { setEditingId(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input type="text" placeholder="Buscar por nome, CPF ou email..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center h-64 items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients?.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <User size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                        {client.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {client.email}</div>}
                        {client.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {client.phone}</div>}
                        {!client.email && !client.phone && <span className="text-gray-400 italic">Sem contato</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {client.document || '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(client)} className="text-gray-400 hover:text-blue-600 p-1" title="Editar">
                        <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="text-gray-400 hover:text-red-600 p-1" title="Excluir">
                        <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {clients?.length === 0 && (
                  <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          Nenhum cliente cadastrado.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal 
          title={editingId ? "Editar Cliente" : "Novo Cliente"}
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          maxWidth="max-w-3xl" 
       >
          <form onSubmit={handleSave} className="space-y-4">
             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                 <input 
                    type="text" name="name" required autoFocus
                    value={formData.name} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: João da Silva"
                 />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                     <input 
                        type="email" name="email"
                        value={formData.email} onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="joao@email.com"
                     />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                     <input 
                        type="text" name="phone"
                        value={formData.phone} onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="(11) 99999-9999"
                     />
                 </div>
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Documento (CPF/CNPJ)</label>
                 <input 
                    type="text" name="document"
                    value={formData.document} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Apenas números"
                 />
             </div>

             <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                 <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                   Cancelar
                 </button>
                 <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-70">
                   {saving ? 'Salvando...' : <><Save size={18} /> Salvar Cliente</>}
                 </button>
             </div>
          </form>
       </Modal>
    </div>
  );
}