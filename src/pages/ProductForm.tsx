import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Package, Tag, List, DollarSign, Boxes } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { NumericFormat } from 'react-number-format';
import { generateSlug } from '../utils/slugifier';

interface Brand { id: number; name: string; }
interface Category { id: number; name: string; }

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    await fetchBrandsAndCategories();
    if (id) {
      await fetchProduct(Number(id));
    }
    setLoading(false);
  };

  const fetchBrandsAndCategories = async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        supabase.from('brands').select('id, name').is('deleted_at', null).order('name'),
        supabase.from('categories').select('id, name').is('deleted_at', null).order('name')
      ]);
      setBrands(brandsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar marcas e categorias', err);
    }
  };

  const fetchProduct = async (productId: number) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          price: data.price || '',
          stock_quantity: data.stock_quantity || 0,
          brand_id: data.brand_id || 0,
          category_id: data.category_id || 0
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar produto: ' + error.message);
      navigate('/products');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newVal = type === 'number' ? Number(value) : value;
      const newData = { ...prev, [name]: newVal };
      if (name === 'name' && !isEditing) newData.slug = generateSlug(value);
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Nome do produto é obrigatório');

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
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Superior com Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
              title="Voltar para Produtos"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isEditing ? 'Editar Produto' : 'Novo Produto'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditing ? 'Atualize as informações do produto' : 'Cadastre um novo produto no catálogo do ERP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
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
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Produto' : 'Salvar Produto')}</span>
            </button>
          </div>
        </div>

        {/* Card: Dados Básicos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Identificação do Produto</h2>
              <p className="text-xs text-slate-500 mt-0.5">Nome, marca e categoria</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-slate-50 font-mono transition-colors"
                placeholder="iphone-15-pro-max"
              />
            </div>
          </div>
        </div>

        {/* Card: Preço e Estoque */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Preço & Estoque</h2>
              <p className="text-xs text-slate-500 mt-0.5">Preço de venda e quantidade inicial</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono font-bold transition-colors"
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
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-mono transition-colors"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white transition-colors"
                placeholder="Especificações técnicas, observações..."
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
