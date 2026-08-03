import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, List, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { slugify } from '../utils/formatters';

interface Category {
  id: number;
  name: string;
}

export default function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: 0 as number | null
  });

  useEffect(() => {
    fetchParentCategories();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchCategory(id);
    }
  }, [id, isEditing]);

  const fetchParentCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      setParentCategories(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar categorias pai:", err);
    }
  };

  const fetchCategory = async (categoryId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', Number(categoryId))
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          parent_id: data.parent_id || 0
        });
      }
    } catch (err: any) {
      toast.error('Erro ao carregar categoria: ' + err.message);
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && !isEditing) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Preencha o nome da categoria.');

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || slugify(formData.name),
        parent_id: formData.parent_id ? Number(formData.parent_id) : null
      };

      if (isEditing && id) {
        const { error } = await supabase.from('categories').update(payload).eq('id', Number(id));
        if (error) throw error;
        toast.success('Categoria atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
        toast.success('Categoria criada com sucesso!');
      }
      navigate('/categories');
    } catch (err: any) {
      toast.error('Erro ao salvar categoria: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando dados da categoria...</p>
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
            onClick={() => navigate('/categories')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="Voltar para Categorias"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Categorias</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isEditing ? 'Editar Categoria de Produtos' : 'Nova Categoria de Produtos'}
            </h1>
          </div>
        </div>

        {/* CARD ÚNICO CONSOLIDADO DO FORMULÁRIO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
          
          {/* Seção 1: Identificação da Categoria */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <List size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Identificação da Categoria</h2>
                <p className="text-xs text-slate-500">Nome, slug e categoria pai hierárquica</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  placeholder="Ex: Eletrônicos, Smartphones, Acessórios..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Categoria Pai (Opcional)
                </label>
                <select
                  name="parent_id"
                  value={formData.parent_id || 0}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                >
                  <option value={0}>Nenhuma (Categoria Principal)</option>
                  {parentCategories.filter(c => c.id !== Number(id)).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Slug (URL Amigável)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-slate-50 font-medium transition-colors"
                  placeholder="eletronicos"
                />
              </div>
            </div>
          </div>

          {/* RODAPÉ DO CARD COM AÇÕES À DIREITA */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/categories')}
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
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Categoria' : 'Salvar Categoria')}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
