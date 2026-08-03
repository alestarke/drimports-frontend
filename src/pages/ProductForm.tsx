import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package, DollarSign, Boxes, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { NumericFormat } from 'react-number-format';
import { slugify } from '../utils/formatters';

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '' as number | string,
    stock_quantity: 0,
    brand_id: 0,
    category_id: 0
  });

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchProduct(id);
    }
  }, [id, isEditing]);

  const fetchAuxiliaryData = async () => {
    try {
      const { data: bData } = await supabase
        .from('brands')
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      const { data: cData } = await supabase
        .from('categories')
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      setBrands(bData || []);
      setCategories(cData || []);
    } catch (error: any) {
      toast.error('Erro ao carregar marcas e categorias: ' + error.message);
    }
  };

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', Number(productId))
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          price: data.price || 0,
          stock_quantity: data.stock_quantity || 0,
          brand_id: data.brand_id || 0,
          category_id: data.category_id || 0
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar produto: ' + error.message);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    if (!formData.name.trim()) return toast.error('Preencha o nome do produto.');

    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price) || 0,
        brand_id: formData.brand_id || null,
        category_id: formData.category_id || null
      };

      if (isEditing && id) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', Number(id));
        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload]);
        if (error) throw error;
        toast.success('Produto criado com sucesso!');
      }
      navigate('/products');
    } catch (error: any) {
      toast.error('Erro ao salvar produto: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando dados do produto...</p>
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
            onClick={() => navigate('/products')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="Voltar para Produtos"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Produtos</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{isEditing ? 'Editar Produto' : 'Novo Produto'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h1>
          </div>
        </div>

        {/* CARD ÚNICO CONSOLIDADO DO FORMULÁRIO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
          
          {/* Seção 1: Identificação do Produto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Package size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Identificação do Produto</h2>
                <p className="text-xs text-slate-500">Nome, marca e classificação comercial</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Marca
                </label>
                <select
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                >
                  <option value={0}>Selecione a marca...</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Categoria
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                >
                  <option value={0}>Selecione a categoria...</option>
                  {categories.map(c => (
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
                  placeholder="iphone-15-pro-max"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Preço e Estoque */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Preço & Estoque</h2>
                <p className="text-xs text-slate-500">Valor de venda pública e quantidade em estoque</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preço de Venda (R$) *
                </label>
                <NumericFormat
                  value={formData.price}
                  onValueChange={(values) => {
                    setFormData(prev => ({ ...prev, price: values.floatValue || '' }));
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Quantidade em Estoque *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="stock_quantity"
                    required
                    min={0}
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                    placeholder="0"
                  />
                  <Boxes className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Descrição do Produto
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  placeholder="Especificações técnicas, detalhes e observações..."
                />
              </div>
            </div>
          </div>

          {/* RODAPÉ DO CARD COM AÇÕES À DIREITA */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/products')}
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
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Produto' : 'Salvar Produto')}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
