import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, DollarSign, ShoppingBag, User, Package, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { NumericFormat } from 'react-number-format';
import { validateStock } from '../utils/validators';
import { formatBRL } from '../utils/formatters';
import ProductLookup from '../components/ProductLookup';

interface Client { id: number; name: string; }
interface Product { id: number; name: string; price: number; stock_quantity: number; }

export default function SaleForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    client_id: 0,
    product_id: 0,
    quantity: 1,
    unit_price: '' as number | string,
    sale_date: today,
    type: 'venda' as 'venda' | 'doacao' | 'brinde' | 'perda'
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchClients(), fetchProducts()]);
    if (id) {
      await fetchSale(Number(id));
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').is('deleted_at', null).order('name');
    setClients(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').is('deleted_at', null).order('name');
    setProducts(data || []);
  };

  const fetchSale = async (saleId: number) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          client_id: data.client_id || 0,
          product_id: data.product_id || 0,
          quantity: data.quantity || 1,
          unit_price: data.unit_price || '',
          sale_date: data.sale_date ? data.sale_date.substring(0, 10) : today,
          type: data.type || 'venda'
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar venda: ' + error.message);
      navigate('/sales');
    }
  };

  useEffect(() => {
    const qtd = Number(formData.quantity) || 0;
    const price = Number(formData.unit_price) || 0;
    setTotalPrice(qtd * price);
  }, [formData.quantity, formData.unit_price]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.product_id === 0) return toast.error("Selecione um produto!");
    if (formData.type !== 'perda' && formData.client_id === 0) return toast.error("Selecione um cliente!");

    const selectedProd = products.find(p => p.id === Number(formData.product_id));
    if (!isEditing && selectedProd && !validateStock(Number(formData.quantity), selectedProd.stock_quantity)) {
      return toast.error("Quantidade solicitada excede o estoque disponível ou é inválida.");
    }

    setSaving(true);
    try {
      const isNonRevenue = ['doacao', 'brinde', 'perda'].includes(formData.type);
      const payload = {
        client_id: formData.type === 'perda' ? null : Number(formData.client_id),
        product_id: Number(formData.product_id),
        quantity: Number(formData.quantity),
        unit_price: isNonRevenue ? 0 : Number(formData.unit_price) || 0,
        total_price: isNonRevenue ? 0 : totalPrice,
        sale_date: formData.sale_date,
        type: formData.type
      };

      if (isEditing && id) {
        const { error: saleError } = await supabase
          .from('sales')
          .update(payload)
          .eq('id', Number(id));
        if (saleError) throw saleError;
        toast.success('Operação atualizada com sucesso!');
      } else {
        const { error: saleError } = await supabase.from('sales').insert([payload]);
        if (saleError) throw saleError;

        // Baixa de estoque
        if (selectedProd) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock_quantity: selectedProd.stock_quantity - payload.quantity })
            .eq('id', selectedProd.id);
          if (stockError) throw stockError;
        }
        toast.success('Operação registrada com sucesso!');
      }

      navigate('/sales');
    } catch (error: any) {
      toast.error('Erro ao salvar operação: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedProd = products.find(p => p.id === Number(formData.product_id));

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando dados da venda...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Superior com Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/sales')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
              title="Voltar para Vendas"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isEditing ? 'Editar Operação / Venda' : 'Nova Operação / Venda'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditing ? 'Atualize as informações da venda' : 'Registre vendas, doações, brindes ou perdas no ERP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/sales')}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-xl transition-colors shadow-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Operação' : 'Registrar Operação')}</span>
            </button>
          </div>
        </div>

        {/* Card: Tipo e Data da Operação */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tipo & Data da Operação</h2>
              <p className="text-xs text-slate-500 mt-0.5">Defina a modalidade do movimento comercial</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Tipo de Movimento *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-semibold transition-colors"
              >
                <option value="venda">🟢 Venda Convencional (Receita)</option>
                <option value="brinde">🎁 Brinde (Sem receita)</option>
                <option value="doacao">🤝 Doação (Sem receita)</option>
                <option value="perda">🔴 Perda / Avaria (Baixa direta)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Data do Registro *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="sale_date"
                  required
                  value={formData.sale_date}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono transition-colors"
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Cliente e Produto */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Cliente & Produto</h2>
              <p className="text-xs text-slate-500 mt-0.5">Selecione o destinatário e o item vendido</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.type !== 'perda' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Cliente *
                </label>
                <select
                  name="client_id"
                  required
                  value={formData.client_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
                >
                  <option value={0}>Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={formData.type === 'perda' ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Produto *
              </label>
              <ProductLookup
                products={products}
                selectedProductId={formData.product_id}
                onSelect={(prod) => {
                  setFormData(prev => ({
                    ...prev,
                    product_id: prod.id,
                    unit_price: prev.type === 'venda' ? prod.price : 0
                  }));
                }}
              />
              {selectedProd && (
                <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
                  <span>Estoque disponível: <strong className="text-slate-800 font-mono">{selectedProd.stock_quantity} un.</strong></span>
                  <span>Preço cadastrado: <strong className="text-slate-800 font-mono">{formatBRL(selectedProd.price)}</strong></span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card: Quantidades e Valores */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Valores & Quantidade</h2>
              <p className="text-xs text-slate-500 mt-0.5">Preço unitário e cálculo do total da venda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Quantidade *
              </label>
              <input
                type="number"
                name="quantity"
                required
                min={1}
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono transition-colors"
              />
            </div>

            {formData.type === 'venda' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preço Unitário (R$) *
                </label>
                <NumericFormat
                  value={formData.unit_price}
                  onValueChange={(values) => {
                    setFormData(prev => ({ ...prev, unit_price: values.floatValue || '' }));
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  placeholder="R$ 0,00"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono font-bold transition-colors"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preço Unitário
                </label>
                <input
                  type="text"
                  disabled
                  value="R$ 0,00 (Operação sem receita)"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 text-xs italic font-medium"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total da Operação</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {formData.type === 'venda' ? formatBRL(totalPrice) : 'R$ 0,00'}
              </span>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
