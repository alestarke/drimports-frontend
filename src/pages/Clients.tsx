import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Save, User, Phone, Mail, Loader2, MapPin } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { supabase } from '../supabaseClient';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  cep: string;
  address: string;
  address_number: number;
  address_complement: string;
  city: string;
  state: string;
  country: string;
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  cep: '',
  address: '',
  address_number: 0,
  address_complement: '',
  city: '',
  state: '',
  country: 'Brasil'
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  // --- BUSCAR CLIENTES ---
  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null) // Soft delete filter
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SALVAR / ATUALIZAR ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Cliente atualizado!');
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([formData]);
        if (error) throw error;
        toast.success('Cliente cadastrado!');
      }
      handleCloseModal();
      fetchClients();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // --- DELETE (SOFT DELETE) ---
  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "O cliente será arquivado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('clients')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        setClients(prev => prev.filter(c => c.id !== id));
        toast.success('Cliente removido!');
      } catch (error: any) {
        toast.error('Erro ao excluir: ' + error.message);
      }
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({ ...client });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialForm);
  };

  // --- FILTRO DE BUSCA NO FRONTEND ---
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? Number(value) : value;

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (name === 'cep') {
      checkCEP(value);
    }
  };

  // --- BUSCA CEP AUTOMÁTICA ---
  const checkCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          city: data.localidade,
          state: data.uf,
          address_complement: data.complemento
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    }
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center h-64 items-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Localização</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients?.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {client.city ? `${client.city} - ${client.state}` : 'Endereço não informado'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        {client.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {client.email}</div>}
                        {client.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {client.phone}</div>}
                        {!client.email && !client.phone && <span className="text-gray-400 italic">Sem contato</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEdit(client)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="text-gray-400 hover:text-red-600 p-1 transition-colors" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredClients?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                      Nenhum cliente cadastrado no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      <Modal
        title={editingId ? "Editar Cliente" : "Novo Cliente"}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Seção: Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Informações Básicas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text" name="name" required
                  value={formData.name} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: João da Silva"
                />
              </div>
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
          </div>

          {/* Seção: Endereço */}
          <div className="space-y-4 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Endereço e Localização</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input
                  type="text" name="cep"
                  value={formData.cep} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua / Logradouro</label>
                <input
                  type="text" name="address"
                  value={formData.address} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Av. Brasil"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="number" name="address_number"
                  value={formData.address_number} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input
                  type="text" name="address_complement"
                  value={formData.address_complement} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Apt, Bloco..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text" name="city"
                  value={formData.city} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
                <input
                  type="text" name="state"
                  value={formData.state} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <input
                  type="text" name="country"
                  value={formData.country} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Ações do Formulário */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}