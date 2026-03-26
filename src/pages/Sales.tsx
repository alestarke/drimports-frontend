import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ShoppingCart, Save, DollarSign, Calendar, User, Loader2, Filter, Tag, Package } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import ProductLookup from '../components/ProductLookup';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// --- INTERFACES ---
interface Client { id: number; name: string; }
interface Product { id: number; name: string; price: number; stock_quantity: number; }
interface Sale {
  id: number;
  client?: { name: string };
  product?: { name: string };
  product_id: number;
  client_id: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  type: 'venda' | 'doacao' | 'brinde' | 'perda';
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- ESTADOS DE FILTRO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    client_id: 0,
    product_id: 0,
    quantity: 1,
    unit_price: '',
    sale_date: today,
    type: 'venda' as 'venda' | 'doacao' | 'brinde' | 'perda'
  });

  const [totalPrice, setTotalPrice] = useState(0);

  // --- BUSCA INICIAL ---
  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchSales(), fetchClients(), fetchProducts()]);
    setLoading(false);
  };

  // --- CÁLCULO AO VIVO DO TOTAL ---
  useEffect(() => {
    const qtd = Number(formData.quantity) || 0;
    const price = Number(formData.unit_price) || 0;
    setTotalPrice(qtd * price);
  }, [formData.quantity, formData.unit_price]);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`*, client:client_id ( name ), product:product_id ( name )`)
        .order('sale_date', { ascending: false });
      if (error) throw error;
      setSales(data || []);
    } catch (error: any) { toast.error(error.message); }
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').is('deleted_at', null).order('name');
    setClients(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').is('deleted_at', null).order('name');
    setProducts(data || []);
  };

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.product_id === 0) return toast.error("Selecione um produto!");
    if (formData.type !== 'perda' && formData.client_id === 0) return toast.error("Selecione um cliente!");

    setSaving(true);
    try {
      const isNonRevenue = ['doacao', 'brinde', 'perda'].includes(formData.type);
      const payload = {
        client_id: formData.type === 'perda' ? null : Number(formData.client_id),
        product_id: Number(formData.product_id),
        quantity: Number(formData.quantity),
        unit_price: isNonRevenue ? 0 : Number(formData.unit_price),
        total_price: isNonRevenue ? 0 : totalPrice,
        sale_date: formData.sale_date,
        type: formData.type
      };

      // 1. Registra a Operação
      const { error: saleError } = await supabase.from('sales').insert([payload]);
      if (saleError) throw saleError;

      // 2. Baixa de Estoque
      const selectedProd = products.find(p => p.id === payload.product_id);
      if (selectedProd) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: selectedProd.stock_quantity - payload.quantity })
          .eq('id', selectedProd.id);
        if (stockError) throw stockError;
      }

      toast.success('Operação registrada com sucesso!');
      handleCloseModal();
      fetchSales();
      fetchProducts();
    } catch (error: any) { 
      toast.error('Erro ao processar: ' + error.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id: number) => {
    const saleToDelete = sales.find(s => s.id === id);
    const result = await Swal.fire({
      title: 'Cancelar Operação?',
      text: "O estoque será devolvido ao produto.",
      icon: 'warning',
      showCancelButton: true,
      cancelButtonColor: '#3085d6',
      cancelButtonText: 'Não, manter',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, cancelar'
    });

    if (result.isConfirmed) {
      try {
        if (saleToDelete) {
          const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', saleToDelete.product_id).single();
          if (prod) {
            await supabase.from('products').update({ stock_quantity: prod.stock_quantity + saleToDelete.quantity }).eq('id', saleToDelete.product_id);
          }
        }
        await supabase.from('sales').delete().eq('id', id);
        setSales(prev => prev.filter(s => s.id !== id));
        fetchProducts();
        toast.success('Cancelada e estoque estornado!');
      } catch (error: any) { toast.error(error.message); }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ client_id: 0, product_id: 0, quantity: 1, unit_price: '', sale_date: today, type: 'venda' });
  };

  // --- LÓGICA DE FILTRO ---
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      (sale.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'todos' || sale.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatBRL = (val: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const typeStyles: any = {
    venda: 'bg-green-100 text-green-700',
    doacao: 'bg-blue-100 text-blue-700',
    brinde: 'bg-purple-100 text-purple-700',
    perda: 'bg-red-100 text-red-700'
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendas e Saídas</h1>
          <p className="text-gray-500">Gestão financeira e de inventário</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-95">
          <ShoppingCart size={20} /> Nova Operação
        </button>
      </div>

      {/* Área de Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Pesquisar cliente ou produto..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select 
            className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 bg-white"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="todos">Todos os tipos</option>
            <option value="venda">Vendas</option>
            <option value="doacao">Doações</option>
            <option value="brinde">Brindes</option>
            <option value="perda">Perdas</option>
          </select>
        </div>
      </div>

      {/* Tabela de Resultados */}
      {loading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-10 w-10 text-green-600" /></div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente / Produto</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {formatDate(sale.sale_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {sale.client?.name || (sale.type === 'perda' ? 'N/A (Perda)' : 'Cliente Genérico')}
                        </p>
                        <p className="text-xs text-gray-500">{sale.quantity}x {sale.product?.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${typeStyles[sale.type]}`}>
                          {sale.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${sale.total_price > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formatBRL(sale.total_price)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="text-gray-300 hover:text-red-600 p-1 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE OPERAÇÃO */}
      <Modal title="Registrar Nova Operação" isOpen={isModalOpen} onClose={handleCloseModal} maxWidth="max-w-4xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Natureza da Operação</label>
              <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 font-medium">
                <option value="venda">💰 Venda Comercial</option>
                <option value="brinde">🎁 Brinde / Bonificação</option>
                <option value="doacao">🤝 Doação / Cortesia</option>
                <option value="perda">⚠️ Perda (Avaria/Quebra)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input type="date" name="sale_date" value={formData.sale_date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>

          {formData.type !== 'perda' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select name="client_id" value={formData.client_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" required>
                <option value="0">Selecione o Cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
            <ProductLookup 
              products={products} 
              selectedId={formData.product_id} 
              onSelect={(id) => {
                const selectedProd = products.find(p => p.id === id);
                setFormData(prev => ({ 
                  ...prev, 
                  product_id: id,
                  unit_price: formData.type === 'venda' ? selectedProd?.price.toString() || '' : '0'
                }));
              }} 
            />
            {formData.product_id > 0 && (
              <p className="mt-1 text-xs text-gray-500 italic">Estoque disponível: {products.find(p => p.id === Number(formData.product_id))?.stock_quantity || 0} unidades</p>
            )}
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-xl border shadow-inner transition-colors ${formData.type === 'venda' ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-100'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <input type="number" name="quantity" min="1" value={formData.quantity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold" required />
            </div>

            {formData.type === 'venda' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário (R$)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleInputChange} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-bold" required />
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total da Venda</label>
                  <div className="text-3xl font-black text-green-600">{formatBRL(totalPrice)}</div>
                </div>
              </>
            ) : (
              <div className="md:col-span-2 flex items-center">
                <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <Package size={20} /> Esta operação registrará apenas a saída de estoque (R$ 0,00).
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className={`px-8 py-2 rounded-lg flex items-center gap-2 font-bold transition-all active:scale-95 shadow-md disabled:opacity-70 ${formData.type === 'venda' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}>
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Processando...' : formData.type === 'venda' ? 'Finalizar Venda' : 'Confirmar Saída'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}