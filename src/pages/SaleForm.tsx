import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  ShoppingBag, 
  Calendar, 
  Package, 
  DollarSign, 
  Loader2 
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { formatBRL } from '../utils/formatters';
import { NumericFormat } from 'react-number-format';
import ProductLookup from '../components/ProductLookup';

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  brand?: { name: string };
  category?: { name: string };
}

interface Client {
  id: number;
  name: string;
}

export default function SaleForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [formData, setFormData] = useState({
    client_id: 0 as number | null,
    product_id: 0,
    quantity: 1,
    unit_price: '' as number | string,
    sale_date: new Date().toISOString().split('T')[0],
    type: 'venda' as 'venda' | 'brinde' | 'doacao' | 'perda'
  });

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchSale(id);
    }
  }, [id, isEditing]);

  const fetchAuxiliaryData = async () => {
    try {
      const { data: prods } = await supabase
        .from('products')
        .select(`*, brand:brand_id ( name ), category:category_id ( name )`)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      const { data: cls } = await supabase
        .from('clients')
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      setProducts(prods || []);
      setClients(cls || []);
    } catch (err: any) {
      toast.error('Erro ao carregar listas auxiliares: ' + err.message);
    }
  };

  const fetchSale = async (saleId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          client_id: data.client_id,
          product_id: data.product_id,
          quantity: data.quantity,
          unit_price: data.unit_price,
          sale_date: data.sale_date,
          type: data.type || 'venda'
        });
      }
    } catch (err: any) {
      toast.error('Erro ao carregar venda: ' + err.message);
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const selectedProd = products.find(p => p.id === formData.product_id);
  const calculatedUnitPrice = formData.type === 'venda' ? Number(formData.unit_price || 0) : 0;
  const totalPrice = calculatedUnitPrice * Number(formData.quantity || 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'type' && value !== 'venda') {
        updated.unit_price = 0;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) {
      return toast.error('Selecione um produto.');
    }
    if (formData.type !== 'perda' && !formData.client_id) {
      return toast.error('Selecione um cliente para a operação.');
    }
    if (Number(formData.quantity) <= 0) {
      return toast.error('A quantidade deve ser maior que zero.');
    }

    setSaving(true);
    try {
      const payload = {
        client_id: formData.type === 'perda' ? null : Number(formData.client_id),
        product_id: Number(formData.product_id),
        quantity: Number(formData.quantity),
        unit_price: calculatedUnitPrice,
        total_price: totalPrice,
        sale_date: formData.sale_date,
        type: formData.type
      };

      if (isEditing && id) {
        const { error } = await supabase.from('sales').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Operação atualizada!');
      } else {
        if (selectedProd && selectedProd.stock_quantity < Number(formData.quantity)) {
          toast.error(`Estoque insuficiente! Disponível: ${selectedProd.stock_quantity} un.`);
          setSaving(false);
          return;
        }

        const { error } = await supabase.from('sales').insert([payload]);
        if (error) throw error;

        if (selectedProd) {
          await supabase.from('products').update({
            stock_quantity: selectedProd.stock_quantity - Number(formData.quantity)
          }).eq('id', selectedProd.id);
        }

        toast.success('Operação registrada com sucesso!');
      }

      navigate('/sales');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando dados da operação...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-slate-50 min-h-full space-y-4 md:space-y-5">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5">
        
        {/* Header Superior Apenas com Breadcrumb e Título */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="Voltar para Vendas"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Vendas & Operações</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{isEditing ? 'Editar Operação' : 'Nova Operação'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isEditing ? 'Editar Operação Comercial' : 'Nova Operação Comercial'}
            </h1>
          </div>
        </div>

        {/* CARD ÚNICO CONSOLIDADO DO FORMULÁRIO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
          
          {/* Seção 1: Tipo & Data da Operação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <ShoppingBag size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Tipo & Data da Operação</h2>
                <p className="text-xs text-slate-500">Defina a modalidade comercial e a data de emissão</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tipo de Movimento *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                >
                  <option value="venda">🟢 Venda Convencional (Com receita)</option>
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
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  />
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Cliente & Produto */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Package size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Cliente & Produto</h2>
                <p className="text-xs text-slate-500">Selecione o destinatário e o item movimentado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {formData.type !== 'perda' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Cliente *
                  </label>
                  <select
                    name="client_id"
                    required
                    value={formData.client_id || 0}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
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
                    <span>Estoque disponível: <strong className="text-slate-800 font-semibold">{selectedProd.stock_quantity} un.</strong></span>
                    <span>Preço cadastrado: <strong className="text-slate-800 font-semibold">{formatBRL(selectedProd.price)}</strong></span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seção 3: Quantidades e Valores */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Valores & Quantidade</h2>
                <p className="text-xs text-slate-500">Definição de preço unitário e total final da operação</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-end">
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
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
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
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-bold transition-colors"
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
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 text-xs italic font-medium"
                  />
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total da Operação</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5">
                  {formData.type === 'venda' ? formatBRL(totalPrice) : 'R$ 0,00'}
                </span>
              </div>
            </div>
          </div>

          {/* RODAPÉ DO CARD COM AÇÕES À DIREITA */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/sales')}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-xl transition-colors shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Operação' : 'Registrar Operação')}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
