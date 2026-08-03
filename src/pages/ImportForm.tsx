import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Package, 
  Calendar, 
  Store, 
  Calculator, 
  Loader2 
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { formatBRL, formatUSD } from '../utils/formatters';
import { calculateImportCosts } from '../utils/mathEngine';
import { NumericFormat } from 'react-number-format';
import ProductLookup from '../components/ProductLookup';

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
}

interface Trip {
  id: number;
  name: string;
}

export default function ImportForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  const [formData, setFormData] = useState({
    product_id: 0,
    trip_id: 0 as number | null,
    quantity: 1,
    cost_price_usd: '' as number | string,
    exchange_rate: '' as number | string,
    extra_fees_brl: '' as number | string,
    store_name: '',
    import_date: new Date().toISOString().split('T')[0],
    selling_price_brl: '' as number | string
  });

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchImport(id);
    }
  }, [id, isEditing]);

  const fetchAuxiliaryData = async () => {
    try {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      const { data: trps } = await supabase
        .from('trips')
        .select('id, name')
        .is('deleted_at', null)
        .order('travel_date', { ascending: false });

      setProducts(prods || []);
      setTrips(trps || []);
    } catch (err: any) {
      toast.error('Erro ao carregar listas auxiliares: ' + err.message);
    }
  };

  const fetchImport = async (importId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('imports')
        .select('*')
        .eq('id', Number(importId))
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          product_id: data.product_id,
          trip_id: data.trip_id,
          quantity: data.quantity,
          cost_price_usd: data.cost_price_usd,
          exchange_rate: data.exchange_rate,
          extra_fees_brl: data.extra_fees_brl || '',
          store_name: data.store_name || '',
          import_date: data.import_date,
          selling_price_brl: ''
        });
      }
    } catch (err: any) {
      toast.error('Erro ao carregar importação: ' + err.message);
      navigate('/imports');
    } finally {
      setLoading(false);
    }
  };

  const calculated = calculateImportCosts({
    quantity: Number(formData.quantity) || 0,
    costPriceUsd: Number(formData.cost_price_usd) || 0,
    exchangeRate: Number(formData.exchange_rate) || 0,
    extraFeesBrl: Number(formData.extra_fees_brl) || 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) return toast.error('Selecione um produto.');
    if (Number(formData.quantity) <= 0) return toast.error('Quantidade deve ser maior que zero.');
    if (!formData.cost_price_usd) return toast.error('Preencha o custo em dólares.');
    if (!formData.exchange_rate) return toast.error('Preencha a cotação do dólar.');

    setSaving(true);
    try {
      const payload = {
        product_id: Number(formData.product_id),
        trip_id: formData.trip_id ? Number(formData.trip_id) : null,
        quantity: Number(formData.quantity),
        cost_price_usd: Number(formData.cost_price_usd),
        exchange_rate: Number(formData.exchange_rate),
        extra_fees_brl: Number(formData.extra_fees_brl) || 0,
        total_cost_brl: calculated.finalTotalBrl,
        store_name: formData.store_name,
        import_date: formData.import_date
      };

      const selectedProd = products.find(p => p.id === Number(formData.product_id));

      if (isEditing && id) {
        const { error } = await supabase.from('imports').update(payload).eq('id', Number(id));
        if (error) throw error;
        toast.success('Importação atualizada!');
      } else {
        const { error } = await supabase.from('imports').insert([payload]);
        if (error) throw error;

        if (selectedProd) {
          const newQty = selectedProd.stock_quantity + Number(formData.quantity);
          const prodUpdate: any = { stock_quantity: newQty };
          if (formData.selling_price_brl) {
            prodUpdate.price = Number(formData.selling_price_brl);
          }
          await supabase.from('products').update(prodUpdate).eq('id', selectedProd.id);
        }

        toast.success('Importação registrada e estoque atualizado!');
      }

      navigate('/imports');
    } catch (err: any) {
      toast.error('Erro ao salvar importação: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando dados da importação...</p>
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
            onClick={() => navigate('/imports')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="Voltar para Importações"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Importações</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{isEditing ? 'Editar Importação' : 'Nova Importação'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isEditing ? 'Editar Importação / Compra' : 'Nova Importação / Compra'}
            </h1>
          </div>
        </div>

        {/* CARD ÚNICO CONSOLIDADO DO FORMULÁRIO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
          
          {/* Seção 1: Produto e Origem */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Package size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Produto & Origem</h2>
                <p className="text-xs text-slate-500">Selecione o produto, viagem e loja fornecedora</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Produto Importado *
                </label>
                <ProductLookup
                  products={products}
                  selectedProductId={formData.product_id}
                  onSelect={(prod) => setFormData(prev => ({ ...prev, product_id: prod.id }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Viagem Vinculada (Opcional)
                </label>
                <select
                  name="trip_id"
                  value={formData.trip_id || 0}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                >
                  <option value={0}>Selecione a viagem...</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Loja / Fornecedor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="store_name"
                    value={formData.store_name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                    placeholder="Ex: Best Buy, Apple Store..."
                  />
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Data da Compra *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="import_date"
                    required
                    value={formData.import_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  />
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Custo & Cálculo em Reais (Motor Matemático) */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Calculator size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Custo & Cálculo em Reais</h2>
                <p className="text-xs text-slate-500">Custo em dólar, cotação e taxas alfandegárias</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5">
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Custo Unit. (US$) *
                </label>
                <NumericFormat
                  value={formData.cost_price_usd}
                  onValueChange={(values) => {
                    setFormData(prev => ({ ...prev, cost_price_usd: values.floatValue || '' }));
                  }}
                  thousandSeparator=","
                  decimalSeparator="."
                  prefix="US$ "
                  decimalScale={2}
                  fixedDecimalScale
                  placeholder="US$ 0.00"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-bold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Cotação Dólar (R$) *
                </label>
                <NumericFormat
                  value={formData.exchange_rate}
                  onValueChange={(values) => {
                    setFormData(prev => ({ ...prev, exchange_rate: values.floatValue || '' }));
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  placeholder="R$ 5,00"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-bold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Taxas / Impostos (R$)
                </label>
                <NumericFormat
                  value={formData.extra_fees_brl}
                  onValueChange={(values) => {
                    setFormData(prev => ({ ...prev, extra_fees_brl: values.floatValue || '' }));
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  placeholder="R$ 0,00"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                />
              </div>
            </div>

            {/* Resultado dos Cálculos */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total em USD</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {formatUSD(calculated.totalUsd)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Custo Unitário em R$</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {formatBRL(calculated.finalUnitBrl)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Custo Total Final em R$</span>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">
                  {formatBRL(calculated.finalTotalBrl)}
                </p>
              </div>
            </div>

            {!isEditing && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Atualizar Preço de Venda do Produto no Catálogo (Opcional R$)
                </label>
                <NumericFormat
                  value={formData.selling_price_brl}
                  onValueChange={(values) => {
                    setFormData(prev => ({ ...prev, selling_price_brl: values.floatValue || '' }));
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  placeholder="R$ 0,00"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                />
                <p className="text-xs text-slate-400 mt-1">Se preenchido, altera o preço público de venda do produto ao finalizar a importação.</p>
              </div>
            )}
          </div>

          {/* RODAPÉ DO CARD COM AÇÕES À DIREITA */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/imports')}
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
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Importação' : 'Salvar Importação')}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
