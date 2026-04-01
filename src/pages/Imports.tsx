import { useState, useEffect } from 'react';
import { Edit, Trash2, Save, Calculator, Store, Calendar, Loader2, Package, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ProductLookup from '../components/ProductLookup';
import { NumericFormat } from 'react-number-format';
import { calculateImportCosts } from '../utils/mathEngine';
import { generateSlug } from '../utils/slugifier';
import { formatBRL, formatUSD } from '../utils/formatters';

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  brand?: { name: string };
  category?: { name: string };
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
  product?: { name: string; price: number };
  product_id: number;
  quantity: number;
  cost_price_usd: number;
  exchange_rate: number;
  extra_fees_brl: number;
  total_cost_brl: number;
  store_name: string;
  import_date: string;
}

// --- BUSCA DA COTAÇÃO PADRÃO ---
const getDefaultDollarRate = () => {
  try {
    const savedPrefs = localStorage.getItem('drimports_prefs');
    if (savedPrefs) {
      const { defaultDollar } = JSON.parse(savedPrefs);
      return defaultDollar ? Number(defaultDollar) : '';
    }
  } catch (e) {
    console.error(e);
  }
  return '';
};

export default function Imports() {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);

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
    cost_price_usd: '' as number | string,
    exchange_rate: getDefaultDollarRate() as number | string,
    extra_fees_brl: '' as number | string,
    store_name: '',
    import_date: today,
    selling_price_brl: '' as number | string
  });

  const [calculated, setCalculated] = useState({
    totalUsd: 0,
    finalTotalBrl: 0,
    finalUnitBrl: 0
  });

  // --- BUSCA INICIAL ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchImports(),
      fetchProducts(),
      fetchCategories(),
      fetchBrands()
    ]);
    setLoading(false);
  };

  // --- MOTOR MATEMÁTICO ---
  useEffect(() => {
    const { totalUsd, finalTotalBrl, finalUnitBrl } = calculateImportCosts({
      quantity: formData.quantity,
      costPriceUsd: formData.cost_price_usd,
      exchangeRate: formData.exchange_rate,
      extraFeesBrl: formData.extra_fees_brl
    });

    setCalculated({ totalUsd, finalTotalBrl, finalUnitBrl });
  }, [formData]);

  // --- FETCHERS SUPABASE ---
  const fetchImports = async () => {
    try {
      const { data, error } = await supabase
        .from('imports')
        .select(`
          *,
          product:product_id ( name, price )
        `)
        .order('import_date', { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar importações: ' + error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('name');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('categories').select('id, name').is('deleted_at', null).order('name');
      setCategories(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await supabase.from('brands').select('id, name').is('deleted_at', null).order('name');
      setBrands(data || []);
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
      cost_price_usd: record.cost_price_usd || '',
      exchange_rate: record.exchange_rate || '',
      extra_fees_brl: record.extra_fees_brl || '',
      store_name: record.store_name,
      import_date: record.import_date.substring(0, 10),
      selling_price_brl: record.product?.price || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "Esta importação será removida permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#3085d6',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir'
    });
    
    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('imports').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        
        setImports(prev => prev.filter(i => i.id !== id));
        toast.success('Importação excluída!');
      } catch (error: any) {
        toast.error('Erro ao excluir: ' + error.message);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.product_id === 0) return toast.error("Selecione um produto!");

    setSaving(true);
    try {
      const payload = {
        product_id: Number(formData.product_id),
        quantity: Number(formData.quantity),
        cost_price_usd: Number(formData.cost_price_usd) || 0,
        exchange_rate: Number(formData.exchange_rate) || 0,
        extra_fees_brl: Number(formData.extra_fees_brl) || 0,
        total_cost_brl: calculated.finalTotalBrl,
        store_name: formData.store_name,
        import_date: formData.import_date
      };

      if (editingId) {
        const { error } = await supabase.from('imports').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Importação atualizada!');
      } else {
        const { error: importError } = await supabase.from('imports').insert([payload]);
        if (importError) throw importError;

        const productToUpdate = products.find(p => p.id === payload.product_id);
        if (productToUpdate) {
          const newStock = productToUpdate.stock_quantity + payload.quantity;
          const newPrice = Number(formData.selling_price_brl) > 0 ? Number(formData.selling_price_brl) : productToUpdate.price;
          
          await supabase.from('products').update({
            stock_quantity: newStock,
            price: newPrice
          }).eq('id', productToUpdate.id);
        }

        toast.success('Importação registrada e estoque atualizado!');
      }

      handleCloseModal();
      fetchImports();
      fetchProducts();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      product_id: 0, 
      quantity: 1, 
      cost_price_usd: '', 
      exchange_rate: getDefaultDollarRate(),
      extra_fees_brl: '', 
      store_name: '', 
      import_date: today, 
      selling_price_brl: ''
    });
  };

  // --- QUICK PRODUCT HANDLERS ---
  const handleQuickProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuickProduct(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'name') newData.slug = generateSlug(value);
      return newData;
    });
  };

  const handleQuickProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const productPayload = {
        name: quickProduct.name,
        slug: quickProduct.slug,
        stock_quantity: Number(quickProduct.stock_quantity) || 0,
        category_id: Number(quickProduct.category_id) || null,
        brand_id: Number(quickProduct.brand_id) || null,
        price: Number(quickProduct.price) || 0
      };

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([productPayload])
        .select()
        .single();

      if (error) throw error;

      toast.success('Produto criado com sucesso!');
      await fetchProducts();
      
      if (newProduct) {
        setFormData(prev => ({ ...prev, product_id: newProduct.id, selling_price_brl: newProduct.price }));
      }

      setIsQuickProductModalOpen(false);
      setQuickProduct({ name: '', price: 0, stock_quantity: 0, category_id: 0, brand_id: 0, slug: '' });
    } catch (error: any) {
      toast.error('Erro ao criar produto: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Formatadores
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Importações</h1>
          <p className="text-gray-500">Histórico de compras e controle de custos</p>
        </div>
        <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20">
          <Plus size={20} /> Nova Importação
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
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
                    <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> {formatDate(record.import_date)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{record.product?.name || 'Produto Excluído/Indisponível'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Store size={12} /> {record.store_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{record.quantity} un.</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatBRL(record.total_cost_brl)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(record)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(record.id)} className="text-gray-400 hover:text-red-600 p-1 transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {imports.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">Nenhuma importação registrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO */}
      <Modal
        title={editingId ? "Editar Importação" : "Registrar Nova Importação"}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleSave} className="space-y-6">

          {/* LINHA 1: Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Produto Importado</label>
              <ProductLookup
                products={products}
                selectedId={formData.product_id}
                onSelect={(id) => {
                  const selectedProd = products.find(p => p.id === id);
                  setFormData(prev => ({
                    ...prev,
                    product_id: id,
                    selling_price_brl: selectedProd?.price || ''
                  }));
                }}
                onAddNew={(search) => {
                  setQuickProduct(prev => ({ ...prev, name: search, slug: generateSlug(search) }));
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

          {/* LINHA 2: Finanças (Quantidade, Custos e Taxas) com React Number Format */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade (un.)</label>
              <input type="number" name="quantity" min="1" value={formData.quantity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário (USD)</label>
              <NumericFormat
                name="cost_price_usd"
                value={formData.cost_price_usd}
                thousandSeparator="."
                decimalSeparator=","
                prefix="US$ "
                decimalScale={2}
                allowNegative={false}
                onValueChange={(values) => setFormData(prev => ({ ...prev, cost_price_usd: values.floatValue ?? '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="US$ 0,00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cotação Dólar (R$)</label>
              <NumericFormat
                name="exchange_rate"
                value={formData.exchange_rate}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={4}
                allowNegative={false}
                onValueChange={(values) => setFormData(prev => ({ ...prev, exchange_rate: values.floatValue ?? '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                placeholder="R$ 0,0000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxas Extras (R$)</label>
              <NumericFormat
                name="extra_fees_brl"
                value={formData.extra_fees_brl}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                allowNegative={false}
                onValueChange={(values) => setFormData(prev => ({ ...prev, extra_fees_brl: values.floatValue ?? '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-red-600"
                placeholder="R$ 0,00"
              />
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

          {/* --- DEFINIÇÃO DE PREÇO APÓS O CUSTO (Com React Number Format) --- */}
          {!editingId && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4 mt-4">
                <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-800 mb-1">Definir Novo Preço de Venda (R$)</label>
                    <p className="text-xs text-gray-500 mb-2">Este valor atualizará o cadastro do produto na loja.</p>
                    <NumericFormat
                      name="selling_price_brl"
                      value={formData.selling_price_brl}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="R$ "
                      decimalScale={2}
                      allowNegative={false}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, selling_price_brl: values.floatValue ?? '' }))}
                      className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold text-green-700"
                      placeholder="R$ 0,00"
                    />
                </div>
                
                {Number(formData.selling_price_brl) > calculated.finalUnitBrl && (
                  <div className="text-right bg-green-50 p-3 rounded-lg border border-green-100 hidden sm:block">
                    <p className="text-xs text-green-600 font-semibold uppercase">Lucro Estimado / Unid.</p>
                    <p className="text-xl font-bold text-green-700">
                        {formatBRL(Number(formData.selling_price_brl) - calculated.finalUnitBrl)}
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-70 transition-all active:scale-95 shadow-md shadow-blue-600/20">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Registrando...' : editingId ? 'Atualizar Compra' : 'Registrar Compra'}
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
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
             <Package size={18} className="mt-0.5 shrink-0"/>
             <span>Cadastre o básico agora para continuar sua importação. Você pode enriquecer os detalhes na aba "Produtos".</span>
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
            <button type="button" onClick={() => setIsQuickProductModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">Cancelar</button>
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