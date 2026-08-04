import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plane, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { formatBRL } from '../utils/formatters';
import { NumericFormat } from 'react-number-format';

export default function TripForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    travel_date: new Date().toISOString().split('T')[0],
    food_expenses_brl: '' as number | string,
    fuel_expenses_brl: '' as number | string,
    toll_expenses_brl: '' as number | string,
    other_expenses_brl: '' as number | string
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchTrip(id);
    }
  }, [id, isEditing]);

  const fetchTrip = async (tripId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', Number(tripId))
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          travel_date: data.travel_date || new Date().toISOString().split('T')[0],
          food_expenses_brl: data.food_expenses_brl || '',
          fuel_expenses_brl: data.fuel_expenses_brl || '',
          toll_expenses_brl: data.toll_expenses_brl || '',
          other_expenses_brl: data.other_expenses_brl || ''
        });
      }
    } catch (err: any) {
      toast.error('Erro ao carregar viagem: ' + err.message);
      navigate('/trips');
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = 
    (Number(formData.food_expenses_brl) || 0) +
    (Number(formData.fuel_expenses_brl) || 0) +
    (Number(formData.toll_expenses_brl) || 0) +
    (Number(formData.other_expenses_brl) || 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Preencha o nome da viagem.');

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        travel_date: formData.travel_date,
        food_expenses_brl: Number(formData.food_expenses_brl) || 0,
        fuel_expenses_brl: Number(formData.fuel_expenses_brl) || 0,
        toll_expenses_brl: Number(formData.toll_expenses_brl) || 0,
        other_expenses_brl: Number(formData.other_expenses_brl) || 0,
        expenses_brl: totalExpenses
      };

      if (isEditing && id) {
        const { error } = await supabase.from('trips').update(payload).eq('id', Number(id));
        if (error) throw error;
        toast.success('Viagem atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('trips').insert([payload]);
        if (error) throw error;
        toast.success('Viagem criada com sucesso!');
      }
      navigate('/trips');
    } catch (err: any) {
      toast.error('Erro ao salvar viagem: ' + err.message);
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
    <div className="p-4 sm:p-5 md:p-6 bg-slate-50 min-h-full space-y-4 md:space-y-5">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5">
        
        {/* Header Superior Apenas com Breadcrumb e Título */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="Voltar para Viagens"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Viagens</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{isEditing ? 'Editar Viagem' : 'Nova Viagem'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isEditing ? 'Editar Viagem de Compras' : 'Nova Viagem de Compras'}
            </h1>
          </div>
        </div>

        {/* CARD ÚNICO CONSOLIDADO DO FORMULÁRIO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
          
          {/* Seção 1: Identificação da Viagem */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Plane size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Dados da Viagem</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  placeholder="Ex: Viagem Paraguai - Março/2026"
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
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  />
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Despesas da Viagem */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Despesas e Custos (R$)</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Alimentação (R$)
                </label>
                <NumericFormat
                  value={formData.food_expenses_brl}
                  onValueChange={(values) => setFormData(prev => ({ ...prev, food_expenses_brl: values.floatValue || '' }))}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  placeholder="R$ 0,00"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Combustível (R$)
                </label>
                <NumericFormat
                  value={formData.fuel_expenses_brl}
                  onValueChange={(values) => setFormData(prev => ({ ...prev, fuel_expenses_brl: values.floatValue || '' }))}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  placeholder="R$ 0,00"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Pedágio (R$)
                </label>
                <NumericFormat
                  value={formData.toll_expenses_brl}
                  onValueChange={(values) => setFormData(prev => ({ ...prev, toll_expenses_brl: values.floatValue || '' }))}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  placeholder="R$ 0,00"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Outros Gastos (R$)
                </label>
                <NumericFormat
                  value={formData.other_expenses_brl}
                  onValueChange={(values) => setFormData(prev => ({ ...prev, other_expenses_brl: values.floatValue || '' }))}
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

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total de Despesas da Viagem</span>
              <span className="text-xl font-bold text-slate-900 mt-0.5">
                {formatBRL(totalExpenses)}
              </span>
            </div>
          </div>

          {/* RODAPÉ DO CARD COM AÇÕES À DIREITA */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/trips')}
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
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Viagem' : 'Salvar Viagem')}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
