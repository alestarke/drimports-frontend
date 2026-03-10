import { useState, useEffect } from 'react';
import { Edit, Trash2, Plane, Save, Calculator, DollarSign, Store, Calendar } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ProductLookup from '../components/ProductLookup';

interface Product {
  id: number;
  name: string;
  price: string;
  stock_quantity: number;
  brand?: { name: string };
}

interface Category { 
  id: number; 
  name: string; 
}

interface Brand { 
  id: number; 
  name: string; 
}

interface ImportRecord {
  id: number;
  product?: Product;
  product_id: number;
  quantity: number;
  cost_price_usd: string;
  exchange_rate: string;
  extra_fees_brl: string;
  total_cost_brl: string;
  store_name: string;
  import_date: string;
}

export default function Imports() {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [quickProduct, setQuickProduct] = useState({
    name: '',
    price: 0,
    category_id: 0,
    brand_id: 0,
    stock_quantity: 0,
    slug: ''
  });

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    product_id: 0,
    quantity: 1,
    cost_price_usd: '',
    exchange_rate: '',
    extra_fees_brl: '',
    store_name: '',
    import_date: today,
    selling_price_brl: ''
  });

  // Estado para o painel de cálculo ao vivo
  const [calculated, setCalculated] = useState({
    totalUsd: 0,
    finalTotalBrl: 0,
    finalUnitBrl: 0
  });

  // --- BUSCA INICIAL ---
  useEffect(() => {
    fetchImports();
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  // --- MOTOR MATEMÁTICO (Recalcula sempre que os inputs mudam) ---
  useEffect(() => {
    const qtd = Number(formData.quantity) || 0;
    const priceUsd = Number(formData.cost_price_usd) || 0;
    const rate = Number(formData.exchange_rate) || 0;
    const fees = Number(formData.extra_fees_brl) || 0;

    const totalUsd = priceUsd * qtd;
    const baseBrl = totalUsd * rate;
    const finalTotalBrl = baseBrl + fees;
    const finalUnitBrl = qtd > 0 ? (finalTotalBrl / qtd) : 0;

    setCalculated({ totalUsd, finalTotalBrl, finalUnitBrl });
  }, [formData]);

  const fetchImports = async () => {
    try {
      const response = await api.get('/imports');
      setImports(response.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar importações.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?all=true');
      setProducts(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands');
      setBrands(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (record: ImportRecord) => {
    setEditingId(record.id);
    setFormData({
      product_id: record.product_id,
      quantity: record.quantity,
      cost_price_usd: record.cost_price_usd,
      exchange_rate: record.exchange_rate,
      extra_fees_brl: record.extra_fees_brl || '',
      store_name: record.store_name,
      import_date: record.import_date.substring(0, 10),
      selling_price_brl: record.product?.price || ''
    });''
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "Esta importação será removida do histórico.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/imports/${id}`);
        setImports(prev => prev.filter(i => i.id !== id));
        toast.success('Importação excluída!');
      } catch (error) {
        toast.error('Erro ao excluir importação.');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.product_id === 0) return toast.error("Selecione um produto!");

    setSaving(true);
    try {
      const payload = { ...formData, total_cost_brl: calculated.finalTotalBrl };

      if (editingId) {
        await api.put(`/imports/${editingId}`, payload);
        toast.success('Importação atualizada!');
      } else {
        await api.post('/imports', payload);
        toast.success('Importação registrada!');
      }

      handleCloseModal();
      fetchImports();
    } catch (error: any) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      product_id: 0, quantity: 1, cost_price_usd: '', exchange_rate: '',
      extra_fees_brl: '', store_name: '', import_date: today, selling_price_brl: ''
    });
  };

  const handleQuickProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Cria o produto no backend (Ajuste os campos conforme sua Migration de Produtos exigir)
      const response = await api.post('/products', {
        name: quickProduct.name,
        stock_quantity: quickProduct.stock_quantity,
        category_id: quickProduct.category_id || null,
        brand_id: quickProduct.brand_id || null,
        slug: quickProduct.slug,
        price: 0
      });

      const newProduct = response.data; // Pega o produto recém-criado

      toast.success('Produto criado com sucesso!');

      // 1. Atualiza a lista de produtos no select
      await fetchProducts();

      // 2. Auto-seleciona o produto novo na importação atual! (A MÁGICA)
      setFormData(prev => ({ ...prev, product_id: newProduct.id }));

      // 3. Fecha o mini-modal
      setIsQuickProductModalOpen(false);
      setQuickProduct({ name: '', price: 0, stock_quantity: 0, category_id: 0, brand_id: 0, slug: '' });

    } catch (error) {
      toast.error('Erro ao criar produto.');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  const handleQuickProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuickProduct(prev => {
      const newData = { ...prev, [name]: value };
      // Se o campo alterado for o Nome, gera o Slug automaticamente
      if (name === 'name') newData.slug = generateSlug(value);
      return newData;
    });
  };

  // Formatadores
  const formatBRL = (val: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  const formatUSD = (val: number | string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val));
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Importações</h1>
          <p className="text-gray-500">Histórico de compras e controle de custos</p>
        </div>
        <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plane size={20} /> Nova Importação
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Produto / Loja</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Qtd</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Custo Total (R$)</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {imports.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Calendar size={16} /> {formatDate(record.import_date)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{record.product?.name || 'Produto Excluído'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Store size={12} /> {record.store_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{record.quantity} un.</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatBRL(record.total_cost_brl)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(record)} className="text-gray-400 hover:text-blue-600 p-1"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(record.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {imports.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma importação registrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={editingId ? "Editar Importação" : "Registrar Nova Importação"}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleSave} className="space-y-6">

          {/* LINHA 1: Informações Básicas (Produto, Loja e Data) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Produto Importado</label>
              <ProductLookup
                products={products}
                selectedId={formData.product_id}
                onSelect={(id) => {
                  // Acha o produto selecionado
                  const selectedProd = products.find(p => p.id === id);

                  setFormData(prev => ({
                    ...prev,
                    product_id: id,
                    // Se achou o produto, joga o preço atual dele no input
                    selling_price_brl: selectedProd?.price || ''
                  }));
                }}
                onAddNew={(search) => {
                  // O código real que estava escondido pelos "..."
                  setQuickProduct(prev => ({ ...prev, name: search }));
                  setIsQuickProductModalOpen(true);
                }}
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Loja / Fornecedor</label>
              <input type="text" name="store_name" value={formData.store_name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: AliExpress, Apple Store..." required />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da Compra</label>
              <input type="date" name="import_date" value={formData.import_date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* LINHA 2: Finanças (Quantidade, Custos e Taxas) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade (un.)</label>
              <input type="number" name="quantity" min="1" value={formData.quantity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário (USD)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                <input type="number" step="0.01" name="cost_price_usd" value={formData.cost_price_usd} onChange={handleInputChange} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cotação Dólar (R$)</label>
              <input type="number" step="0.0001" name="exchange_rate" value={formData.exchange_rate} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50" placeholder="Ex: 5.1230" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxas Extras (R$)</label>
              <input type="number" step="0.01" name="extra_fees_brl" value={formData.extra_fees_brl} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-red-600" placeholder="0.00" />
            </div>
          </div>

          {/* LINHA 3: PAINEL DE RESUMO (Cálculo Automático) */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-inner">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-4">
              <Calculator size={18} /> Resumo da Importação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="flex flex-col">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Total em Dólar</span>
                <span className="text-xl font-medium text-gray-800">{formatUSD(calculated.totalUsd)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Custo Total (BRL)</span>
                <span className="text-xl font-bold text-gray-800">{formatBRL(calculated.finalTotalBrl)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Custo Final / Unidade</span>
                <span className="text-xl font-bold text-gray-800">{formatBRL(calculated.finalUnitBrl)}</span>
              </div>
            </div>
          </div>

          {/* --- NOVIDADE: DEFINIÇÃO DE PREÇO APÓS O CUSTO --- */}
           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4 mt-4">
               <div className="flex-1">
                   <label className="block text-sm font-bold text-gray-800 mb-1">Definir Novo Preço de Venda (R$)</label>
                   <p className="text-xs text-gray-500 mb-2">Este valor atualizará o cadastro do produto na loja.</p>
                   <input 
                      type="number" step="0.01" name="selling_price_brl" 
                      value={formData.selling_price_brl} 
                      onChange={handleInputChange} 
                      className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold text-green-700" 
                      placeholder="Ex: 150.00"
                   />
               </div>
               
               {/* Lucro estimado ao vivo */}
               {Number(formData.selling_price_brl) > calculated.finalUnitBrl && (
                 <div className="text-right bg-green-50 p-3 rounded-lg border border-green-100 hidden sm:block">
                    <p className="text-xs text-green-600 font-semibold uppercase">Lucro Estimado / Unid.</p>
                    <p className="text-xl font-bold text-green-700">
                        {formatBRL(Number(formData.selling_price_brl) - calculated.finalUnitBrl)}
                    </p>
                 </div>
               )}
           </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-70 transition-colors shadow-sm">
              {saving ? 'Registrando...' : <><Save size={18} /> {editingId ? 'Atualizar Compra' : 'Registrar Compra'}</>}
            </button>
          </div>
        </form>
      </Modal>
      {/* --- MINI MODAL DE CADASTRO RÁPIDO DE PRODUTO --- */}
      <Modal
        title="Cadastro Rápido de Produto"
        isOpen={isQuickProductModalOpen}
        onClose={() => setIsQuickProductModalOpen(false)}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleQuickProductSave} className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
            Cadastre o básico agora para continuar sua importação. Você pode enriquecer os detalhes deste produto depois na aba "Produtos".
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
            <input
              type="text" name="name" required autoFocus
              value={quickProduct.name}
              onChange={handleQuickProductChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                name="category_id" required
                value={quickProduct.category_id}
                onChange={handleQuickProductChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="0">Selecione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <select
                name="brand_id" required
                value={quickProduct.brand_id}
                onChange={handleQuickProductChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="0">Selecione...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
   
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <button type="button" onClick={() => setIsQuickProductModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              {saving ? 'Salvando...' : <><Save size={18} /> Salvar </>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}