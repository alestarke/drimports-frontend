import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plane, Calendar, DollarSign, Utensils, Fuel, Ticket, Receipt } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { NumericFormat } from 'react-number-format';
import { formatBRL } from '../utils/formatters';

export default function TripForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    travel_date: today,
    food_expenses_brl: '' as number | string,
    fuel_expenses_brl: '' as number | string,
    toll_expenses_brl: '' as number | string,
    other_expenses_brl: '' as number | string
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTrip(Number(id));
    }
  }, [id]);

  const fetchTrip = async (tripId: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          travel_date: data.travel_date ? data.travel_date.substring(0, 10) : today,
          food_expenses_brl: data.food_expenses_brl || '',
          fuel_expenses_brl: data.fuel_expenses_brl || '',
          toll_expenses_brl: data.toll_expenses_brl || '',
          other_expenses_brl: data.other_expenses_brl || ''
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar viagem: ' + error.message);
      navigate('/trips');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const food = Number(formData.food_expenses_brl) || 0;
  const fuel = Number(formData.fuel_expenses_brl) || 0;
  const toll = Number(formData.toll_expenses_brl) || 0;
  const other = Number(formData.other_expenses_brl) || 0;
  const totalExpenses = food + fuel + toll + other;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('O nome da viagem é obrigatório!');

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        travel_date: formData.travel_date,
        food_expenses_brl: food,
        fuel_expenses_brl: fuel,
        toll_expenses_brl: toll,
        other_expenses_brl: other,
        expenses_brl: totalExpenses
      };

      if (isEditing && id) {
        const { error } = await supabase.from('trips').update(payload).eq('id', Number(id));
        if (error) throw error;
        toast.success('Viagem atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('trips').insert([payload]);
        if (error) throw error;
        toast.success('Viagem registrada com sucesso!');
      }
      navigate('/trips');
    } catch (error: any) {
      toast.error('Erro ao salvar viagem: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando dados da viagem...</p>
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
              onClick={() => navigate('/trips')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
              title="Voltar para Viagens"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isEditing ? 'Editar Viagem' : 'Nova Viagem'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditing ? 'Atualize as despesas e dados da viagem' : 'Cadastre uma nova viagem de compras e controle seus gastos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/trips')}
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
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Viagem' : 'Salvar Viagem')}</span>
            </button>
          </div>
        </div>

        {/* Card: Dados Gerais */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Plane size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Identificação da Viagem</h2>
              <p className="text-xs text-slate-500 mt-0.5">Nome e data de realização</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nome da Viagem *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
                placeholder="Ex: Viagem Miami - Outubro/2026"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Data da Viagem *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="travel_date"
                  required
                  value={formData.travel_date}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono transition-colors"
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Despesas por Categoria */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Despesas por Categoria (R$)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Gastos com alimentação, combustível, pedágio e outros</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Utensils size={14} className="text-sky-600" />
                Alimentação (R$)
              </label>
              <NumericFormat
                value={formData.food_expenses_brl}
                onValueChange={(values) => {
                  setFormData(prev => ({ ...prev, food_expenses_brl: values.floatValue || '' }));
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Fuel size={14} className="text-amber-600" />
                Combustível (R$)
              </label>
              <NumericFormat
                value={formData.fuel_expenses_brl}
                onValueChange={(values) => {
                  setFormData(prev => ({ ...prev, fuel_expenses_brl: values.floatValue || '' }));
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Ticket size={14} className="text-indigo-600" />
                Pedágio (R$)
              </label>
              <NumericFormat
                value={formData.toll_expenses_brl}
                onValueChange={(values) => {
                  setFormData(prev => ({ ...prev, toll_expenses_brl: values.floatValue || '' }));
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Receipt size={14} className="text-rose-600" />
                Outros Gastos (R$)
              </label>
              <NumericFormat
                value={formData.other_expenses_brl}
                onValueChange={(values) => {
                  setFormData(prev => ({ ...prev, other_expenses_brl: values.floatValue || '' }));
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

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total das Despesas da Viagem</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono">
              {formatBRL(totalExpenses)}
            </span>
          </div>
        </div>

      </form>
    </div>
  );
}
