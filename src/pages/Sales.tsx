import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ShoppingCart, Save, DollarSign, Calendar, User } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ProductLookup from '../components/ProductLookup';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Interfaces
interface Client { id: number; name: string; }
interface Product { id: number; name: string; price: string | number; stock_quantity: number; brand?: { name: string }; }
interface Sale {
  id: number;
  client?: Client;
  product?: Product;
  product_id: number;
  client_id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  sale_date: string;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    client_id: 0,
    product_id: 0,
    quantity: 1,
    unit_price: '',
    sale_date: today
  });

  // Calculado automaticamente
  const [totalPrice, setTotalPrice] = useState(0);

  // --- BUSCA INICIAL ---
  useEffect(() => {
    fetchSales();
    fetchClients();
    fetchProducts();
  }, []);

  // --- CÁLCULO AO VIVO DO TOTAL ---
  useEffect(() => {
    const qtd = Number(formData.quantity) || 0;
    const price = Number(formData.unit_price) || 0;
    setTotalPrice(qtd * price);
  }, [formData.quantity, formData.unit_price]);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data?.data || []);
    } catch (error) { } finally { setLoading(false); }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients?all=true');
      setClients(response.data?.data || response.data || []);
    } catch (error) { console.error(error); }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?all=true');
      setProducts(response.data || []);
    } catch (error) { console.error(error); }
  };

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Cancelar Venda?',
      text: "Isso removerá a venda do histórico (O estoque precisará ser ajustado manualmente).",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, cancelar venda',
      cancelButtonText: 'Não, manter venda'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/sales/${id}`);
        setSales(prev => prev.filter(s => s.id !== id));
        toast.success('Venda cancelada!');
      } catch (error) { }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.product_id === 0) return toast.error("Selecione um produto!");
    if (formData.client_id === 0) return toast.error("Selecione um cliente!");

    // Validação de Estoque no Frontend (Aviso amigável)
    const selectedProd = products.find(p => p.id === formData.product_id);
    if (selectedProd && selectedProd.stock_quantity < formData.quantity) {
        return toast.error(`Estoque insuficiente! Você só tem ${selectedProd.stock_quantity} unidades.`);
    }

    setSaving(true);
    try {
      const payload = { ...formData, total_price: totalPrice };
      await api.post('/sales', payload);
      toast.success('Venda registrada com sucesso!');
      
      handleCloseModal();
      fetchSales();
      fetchProducts(); // Recarrega produtos para atualizar o estoque na tela
    } catch (error: any) {
      console.error(error);

    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ client_id: 0, product_id: 0, quantity: 1, unit_price: '', sale_date: today });
  };

  const formatBRL = (val: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
            <p className="text-gray-500">Registre suas saídas e faturamento</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <ShoppingCart size={20} /> Nova Venda
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Calendar size={16}/> {formatDate(sale.sale_date)}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{sale.client?.name || 'Cliente Genérico'}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">{sale.product?.name || 'Produto Excluído'}</p>
                    <p className="text-xs text-gray-500">{sale.quantity}x de {formatBRL(sale.unit_price)}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">{formatBRL(sale.total_price)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(sale.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma venda registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE VENDA */}
      <Modal title="Registrar Venda" isOpen={isModalOpen} onClose={handleCloseModal} maxWidth="max-w-5xl">
        <form onSubmit={handleSave} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <select name="client_id" value={formData.client_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" required>
                      <option value="0">Selecione o Cliente...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data da Venda</label>
                  <input type="date" name="sale_date" value={formData.sale_date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
           </div>

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
                        unit_price: selectedProd?.price.toString() || '' // Puxa o preço padrão do produto!
                    }));
                }} 
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                  <input type="number" name="quantity" min="1" value={formData.quantity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário (R$)</label>
                  <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                      <input type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleInputChange} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" required />
                  </div>
              </div>
              <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total da Venda</label>
                  <div className="text-2xl font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                      {formatBRL(totalPrice)}
                  </div>
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
               <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancelar</button>
               <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                 {saving ? 'Registrando...' : <><Save size={18} /> Confirmar Venda</>}
               </button>
           </div>
        </form>
      </Modal>
    </div>
  );
}