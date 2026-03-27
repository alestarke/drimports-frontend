import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Save, Loader2, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { NumericFormat } from 'react-number-format';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  brand_id: number;
  category_id: number;
  brand?: { name: string };
  category?: { name: string };
}

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function Products() {
  // --- ESTADOS ---
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '' as number | string, 
    stock_quantity: 0,
    brand_id: 0,
    category_id: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchBrandsAndCategories()]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, brand:brand_id ( name ), category:category_id ( name )`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar produtos: " + err.message);
    }
  };

  const fetchBrandsAndCategories = async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        supabase.from('brands').select('id, name').is('deleted_at', null).order('name'),
        supabase.from('categories').select('id, name').is('deleted_at', null).order('name')
      ]);
      setBrands(brandsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar auxiliares", err);
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newVal = type === 'number' ? Number(value) : value;
      const newData = { ...prev, [name]: newVal };
      if (name === 'name' && !editingId) newData.slug = generateSlug(value);
      return newData;
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price || '',
      stock_quantity: product.stock_quantity,
      brand_id: product.brand_id,
      category_id: product.category_id
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '', slug: '', description: '', price: '', stock_quantity: 0, brand_id: 0, category_id: 0 // CORREÇÃO 3
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price) || 0, 
        brand_id: formData.brand_id || null,
        category_id: formData.category_id || null
      };

      const { error } = editingId 
        ? await supabase.from('products').update(payload).eq('id', editingId)
        : await supabase.from('products').insert([payload]);

      if (error) throw error;

      toast.success(editingId ? 'Produto atualizado!' : 'Produto criado!');
      handleCloseModal();
      fetchProducts();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "O produto será movido para a lixeira.",
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#3085d6',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        toast.success('Produto excluído!');
        fetchProducts();
      } catch (error: any) {
        toast.error('Erro ao excluir: ' + error.message);
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
          <p className="text-gray-500">Gerencie seu catálogo de itens</p>
        </div>
        <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20">
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input 
            type="text" placeholder="Buscar produto pelo nome..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Package size={24} /></div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{product.brand?.name?.toLowerCase() || 'Sem marca'} • {product.category?.name?.toLowerCase() || 'Sem categoria'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {product.stock_quantity} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                        <button title="Editar Produto" onClick={() => handleEditProduct(product)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                        <button title="Remover Produto" onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">Nenhum produto encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal title={editingId ? "Editar Produto" : "Novo Produto"} isOpen={isModalOpen} onClose={handleCloseModal} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
            <input 
              type="text" name="name" required value={formData.name} onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: iPhone 15 Pro Max"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <NumericFormat
                name="price"
                value={formData.price}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                allowNegative={false}
                onValueChange={(values) => {
                  setFormData(prev => ({ ...prev, price: values.floatValue ?? '' }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="R$ 0,00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Inicial</label>
              <input type="number" name="stock_quantity" required value={formData.stock_quantity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" required>
                <option value={0}>Selecione uma categoria...</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <select name="brand_id" value={formData.brand_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" required>
                <option value={0}>Selecione uma marca...</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea name="description" rows={3} value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Detalhes técnicos do produto..." />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-70 transition-all active:scale-95 shadow-md shadow-blue-600/20">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Salvando...' : editingId ? 'Atualizar Produto' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}