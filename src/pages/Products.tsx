import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Save } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  brand?: { name: string }; 
  category?: { name: string };
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Novo estado para controlar se estamos editando (guarda o ID)
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock_quantity: 0,
    brand_id: 1,
    category_id: 1 
  });

  useEffect(() => {
    fetchProducts();
  }, []); 

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir o modal em modo de EDIÇÃO
  const handleEditProduct = async (id: number) => {
    // 1. Abre o modal e mostra loading (opcional, mas boa prática)
    setIsModalOpen(true);
    setEditingId(id); // Marca que estamos editando este ID

    try {
        // 2. Busca os dados frescos do produto na API (GET /products/{id})
        const response = await api.get(`/products/${id}`);
        const product = response.data.data; // O Laravel geralmente retorna o objeto direto no show()

        console.log("Produto carregado para edição:", product);

        // 3. Preenche o formulário com os dados vindos do banco
        setFormData({
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            price: product.price,
            stock_quantity: product.stock_quantity,
            brand_id: product.brand_id || 1,
            category_id: product.category_id || 1
        });

    } catch (error) {
        console.error("Erro ao carregar produto", error);
        toast.error("Erro ao carregar detalhes do produto.");
        handleCloseModal();
    }
  };

  // Função para fechar e limpar tudo (Reset)
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null); // Limpa o ID de edição
    setFormData({ // Limpa o formulário
        name: '',
        slug: '',
        description: '',
        price: '',
        stock_quantity: 0,
        brand_id: 1,
        category_id: 1
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
        if (editingId) {
            // --- MODO EDIÇÃO (PUT) ---
            await api.put(`/products/${editingId}`, formData);
            toast.success('Produto atualizado com sucesso!');
        } else {
            // --- MODO CRIAÇÃO (POST) ---
            await api.post('/products', formData);
            toast.success('Produto criado com sucesso!');
        }
        
        handleCloseModal(); // Fecha e limpa
        fetchProducts(); // Recarrega a tabela

    } catch (error) {
        console.error('Erro ao salvar:', error);
        toast.error('Erro ao salvar. Verifique os dados.');
    } finally {
        setSaving(false);
    }
  };

  // Funções Auxiliares (Slug, Moeda, Input)
  const generateSlug = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'name') newData.slug = generateSlug(value);
      return newData;
    });
  };

  const formatCurrency = (value: string | number) => {
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir?")) {
        try {
            await api.delete(`/products/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Erro ao deletar", error);
            toast.error("Erro ao deletar produto.");
        }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen relative">
      
      {/* Header e Busca (Iguais ao anterior) */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
            <p className="text-gray-500">Gerencie seu catálogo</p>
        </div>
        <button 
            // Ao clicar em Novo, garantimos que não tem ID selecionado
            onClick={() => { setEditingId(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input type="text" placeholder="Buscar produto..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estoque</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Package size={24} /></div>
                        <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-blue-600">{product.brand?.name} • {product.category?.name}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.stock_quantity > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock_quantity} unid.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {/* BOTÃO DE EDITAR */}
                    <button 
                        onClick={() => handleEditProduct(product.id)}
                        className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
                        title="Editar"
                    >
                        <Edit size={18} />
                    </button>
                    {/* BOTÃO DE DELETAR */}
                    <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Reutilizável */}
      <Modal 
          title={editingId ? "Editar Produto" : "Novo Produto"}
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          maxWidth="max-w-2xl"
       >
          <form onSubmit={handleSave} className="space-y-4">
             {/* Nome */}
             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                 <input 
                    type="text" name="name" required
                    value={formData.name} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 />
             </div>

             {/* Slug */}
             <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">URL (Slug)</label>
                 <input 
                    type="text" name="slug" readOnly
                    value={formData.slug}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-sm outline-none"
                 />
             </div>

             <div className="grid grid-cols-2 gap-4">
                {/* Preço */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                    <input 
                        type="number" name="price" step="0.01" required
                        value={formData.price} onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                {/* Estoque */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                    <input 
                        type="number" name="stock_quantity" required
                        value={formData.stock_quantity} onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
             </div>

             {/* Descrição */}
             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                 <textarea 
                    name="description" rows={3}
                    value={formData.description} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                 />
             </div>

             {/* Footer */}
             <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                 <button 
                    type="button" 
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                    type="submit" 
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-70 transition-colors"
                 >
                   {saving ? 'Salvando...' : <><Save size={18} /> {editingId ? 'Atualizar' : 'Salvar'}</>}
                 </button>
             </div>
          </form>
       </Modal>
    </div>
  );
}