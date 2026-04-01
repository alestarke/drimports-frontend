import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, List, Save, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { generateSlug } from '../utils/slugifier';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
}

export default function Categories() {
  // --- ESTADOS ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: null as number | null
  });

  // --- BUSCAR DADOS ---
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar categorias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÕES AUXILIARES ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { 
        ...prev, 
        [name]: name === 'parent_id' ? (value === "" ? null : Number(value)) : value 
      };
      if (name === 'name') newData.slug = generateSlug(value);
      return newData;
    });
  };

  // --- AÇÕES DO CRUD ---
  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id || null
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Isso pode afetar produtos vinculados a esta categoria!",
        icon: 'warning',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#3085d6',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
        try {
            const { error } = await supabase
              .from('categories')
              .update({ deleted_at: new Date().toISOString() })
              .eq('id', id);

            if (error) throw error;
            
            setCategories(prev => prev.filter(c => c.id !== id));
            toast.success('Categoria excluída!');
        } catch (error: any) {
            toast.error('Erro ao excluir: ' + error.message);
        }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Categoria atualizada!');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([formData]);
        if (error) throw error;
        toast.success('Categoria criada!');
      }

      handleCloseModal();
      fetchCategories();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '', parent_id: null });
  };

  // --- FILTRO DE BUSCA ---
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
            <p className="text-gray-500">Organize seus produtos por seções</p>
        </div>
        <button 
            onClick={() => { setEditingId(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} /> Nova Categoria
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="Buscar categoria..." 
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
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria Principal</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <List size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {categories.find(c => c.id === category.parent_id)?.name || '---'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{category.slug}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(category)} className="text-gray-400 hover:text-blue-600 p-1">
                        <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="text-gray-400 hover:text-red-600 p-1">
                        <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal 
          title={editingId ? "Editar Categoria" : "Nova Categoria"}
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          maxWidth="max-w-lg"
       >
          <form onSubmit={handleSave} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria</label>
                  <input 
                    type="text" name="name" required
                    value={formData.name} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Smartphones, Acessórios..."
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Pai (Opcional)</label>
                  <select 
                    name="parent_id"
                    value={formData.parent_id || ""} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Nenhuma (Categoria Principal)</option>
                    {categories
                      .filter(c => c.id !== editingId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    }
                  </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea 
                    name="description" 
                    value={formData.description} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                    placeholder="Descrição da categoria..."
                  />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95">
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
              </div>
          </form>
       </Modal>
    </div>
  );
}