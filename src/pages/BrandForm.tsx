import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Tag } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { generateSlug } from '../utils/slugifier';

export default function BrandForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBrand(Number(id));
    }
  }, [id]);

  const fetchBrand = async (brandId: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          slug: data.slug || ''
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar marca: ' + error.message);
      navigate('/brands');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'name' && !isEditing) newData.slug = generateSlug(value);
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Nome da marca é obrigatório');

    setSaving(true);
    try {
      if (isEditing && id) {
        const { error } = await supabase
          .from('brands')
          .update(formData)
          .eq('id', Number(id));
        if (error) throw error;
        toast.success('Marca atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('brands')
          .insert([formData]);
        if (error) throw error;
        toast.success('Marca criada com sucesso!');
      }
      navigate('/brands');
    } catch (error: any) {
      toast.error('Erro ao salvar marca: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando dados da marca...</p>
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
              onClick={() => navigate('/brands')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
              title="Voltar para Marcas"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isEditing ? 'Editar Marca' : 'Nova Marca'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditing ? 'Atualize o nome e identificador da marca' : 'Cadastre uma nova marca de produto no ERP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/brands')}
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
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Marca' : 'Salvar Marca')}</span>
            </button>
          </div>
        </div>

        {/* Card de Formulário */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Informações da Marca</h2>
              <p className="text-xs text-slate-500 mt-0.5">Preencha os campos abaixo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nome da Marca *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
                placeholder="Ex: Apple, Samsung, Xiaomi..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Slug (URL amigável)
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-slate-50 font-mono transition-colors"
                placeholder="ex: apple, samsung"
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
