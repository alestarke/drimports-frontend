import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, Save } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface Brand {
  id: number;
  name: string;
  slug: string;
}

export default function Brands() {
  // --- ESTADOS ---
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Formulário simples (apenas nome e slug)
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });

  // --- BUSCAR DADOS ---
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands');
      setBrands(response.data.data); 
    } catch (error) {
      console.error('Erro ao buscar marcas', error);
      toast.error('Erro ao carregar marcas.');
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÕES AUXILIARES ---
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'name') newData.slug = generateSlug(value);
      return newData;
    });
  };

  // --- AÇÕES DO CRUD ---
  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setFormData({
      name: brand.name,
      slug: brand.slug
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    // Confirmação (pode usar window.confirm se preferir)
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Isso pode afetar produtos vinculados a esta marca!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/brands/${id}`);
            setBrands(prev => prev.filter(b => b.id !== id));
            toast.success('Marca excluída com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir. Verifique se há produtos vinculados.');
        }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        // Editar
        await api.put(`/brands/${editingId}`, formData);
        toast.success('Marca atualizada!');
      } else {
        // Criar
        await api.post('/brands', formData);
        toast.success('Marca criada!');
      }

      handleCloseModal();
      fetchBrands();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar marca.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', slug: '' });
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Marcas</h1>
            <p className="text-gray-500">Gerencie os fabricantes</p>
        </div>
        <button 
            onClick={() => { setEditingId(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Nova Marca
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input type="text" placeholder="Buscar marca..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marca</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                            <Tag size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{brand.slug}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                        onClick={() => handleEdit(brand)}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="Editar"
                    >
                        <Edit size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(brand.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Excluir"
                    >
                        <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                  <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                          Nenhuma marca cadastrada.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal 
          title={editingId ? "Editar Marca" : "Nova Marca"}
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          maxWidth="max-w-md" // Modal menorzinho
       >
          <form onSubmit={handleSave} className="space-y-4">
             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Marca</label>
                 <input 
                    type="text" name="name" required
                    value={formData.name} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Samsung, Apple..."
                 />
             </div>

             <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">URL (Automático)</label>
                 <input 
                    type="text" name="slug" readOnly
                    value={formData.slug}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-sm outline-none"
                 />
             </div>

             <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                 <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                   Cancelar
                 </button>
                 <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                   {saving ? 'Salvando...' : <><Save size={18} /> Salvar</>}
                 </button>
             </div>
          </form>
       </Modal>
    </div>
  );
}