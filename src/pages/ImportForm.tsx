import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Calculator, Store, Calendar, Package, Plane, DollarSign } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { NumericFormat } from 'react-number-format';
import ProductLookup from '../components/ProductLookup';
import { calculateImportCosts } from '../utils/mathEngine';
import { formatBRL, formatUSD } from '../utils/formatters';

interface Product { id: number; name: string; price: number; stock_quantity: number; }
interface Trip { id: number; name: string; }

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

export default function ImportForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [products, setProducts] = useState<Product[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    product_id: 0,
    trip_id: 0,
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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchTrips()]);
    if (id) {
      await fetchImportRecord(Number(id));
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').is('deleted_at', null).order('name');
    setProducts(data || []);
  };

  const fetchTrips = async () => {
    const { data } = await supabase.from('trips').select('id, name').is('deleted_at', null).order('travel_date', { ascending: false });
    setTrips(data || []);
  };

  const fetchImportRecord = async (importId: number) => {
    try {
      const { data, error } = await supabase
        .from('imports')
        .select('*')
        .eq('id', importId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          product_id: data.product_id || 0,
          trip_id: data.trip_id || 0,
          quantity: data.quantity || 1,
          cost_price_usd: data.cost_price_usd || '',
          exchange_rate: data.exchange_rate || '',
          extra_fees_brl: data.extra_fees_brl || '',
          store_name: data.store_name || '',
          import_date: data.import_date ? data.import_date.substring(0, 10) : today,
          selling_price_brl: ''
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar importação: ' + error.message);
      navigate('/imports');
    }
  };

  useEffect(() => {
    const { totalUsd, finalTotalBrl, finalUnitBrl } = calculateImportCosts({
      quantity: formData.quantity,
      costPriceUsd: formData.cost_price_usd,
      exchangeRate: formData.exchange_rate,
      extraFeesBrl: formData.extra_fees_brl
    });

    setCalculated({ totalUsd, finalTotalBrl, finalUnitBrl });
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.product_id === 0) return toast.error("Selecione um produto!");
    if (!formData.cost_price_usd) return toast.error("Informe o preço de custo em USD!");
    if (!formData.exchange_rate) return toast.error("Informe a cotação do Dólar!");

    setSaving(true);
    try {
      const payload = {
        product_id: Number(formData.product_id),
        trip_id: Number(formData.trip_id) || null,
        quantity: Number(formData.quantity),
        cost_price_usd: Number(formData.cost_price_usd),
        exchange_rate: Number(formData.exchange_rate),
        extra_fees_brl: Number(formData.extra_fees_brl) || 0,
        total_cost_brl: calculated.finalTotalBrl,
        store_name: formData.store_name,
        import_date: formData.import_date
      };

      if (isEditing && id) {
        const { error } = await supabase.from('imports').update(payload).eq('id', Number(id));
        if (error) throw error;
        toast.success('Importação atualizada!');
      } else {
        const { error: importError } = await supabase.from('imports').insert([payload]);
        if (importError) throw importError;

        // Atualizar estoque e preço do produto
        const selectedProd = products.find(p => p.id === payload.product_id);
        if (selectedProd) {
          const updatePayload: any = {
            stock_quantity: selectedProd.stock_quantity + payload.quantity
          };
          if (formData.selling_price_brl) {
            updatePayload.price = Number(formData.selling_price_brl);
          }
          await supabase.from('products').update(updatePayload).eq('id', selectedProd.id);
        }
        toast.success('Importação e estoque atualizados com sucesso!');
      }

      navigate('/imports');
    } catch (error: any) {
      toast.error('Erro ao salvar importação: ' + error.message);
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
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Superior com Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/imports')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
              title="Voltar para Importações"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isEditing ? 'Editar Importação' : 'Nova Importação / Compra'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditing ? 'Atualize as taxas e quantidades importadas' : 'Registre novas aquisições de produtos e entrada em estoque'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/imports')}
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
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Importação' : 'Salvar Importação')}</span>
            </button>
          </div>
        </div>

        {/* Card: Produto e Viagem */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Produto & Origem</h2>
              <p className="text-xs text-slate-500 mt-0.5">Selecione o produto e a viagem correspondente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="relative">
                <select
                  name="trip_id"
                  value={formData.trip_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
                >
                  <option value={0}>Selecione a viagem...</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
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
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
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
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono transition-colors"
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Custos e Cotação (Motor Matemático) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Custo & Cálculo em Reais</h2>
              <p className="text-xs text-slate-500 mt-0.5">Custo em dólar, cotação e taxas alfandegárias</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono font-bold transition-colors"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono font-bold transition-colors"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono transition-colors"
              />
            </div>
          </div>

          {/* Resultado dos Cálculos */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total em USD</span>
              <p className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
                {formatUSD(calculated.totalUsd)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custo Unitário em R$</span>
              <p className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
                {formatBRL(calculated.finalUnitBrl)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custo Total Final em R$</span>
              <p className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">Se preenchido, altera o preço público de venda do produto ao finalizar a importação.</p>
            </div>
          )}
        </div>

      </form>
    </div>
  );
}
