import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, MapPin, Loader2, Phone, Mail } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cep: '',
    address: '',
    address_number: '',
    address_complement: '',
    city: '',
    state: '',
    country: 'Brasil'
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchClient(id);
    }
  }, [id, isEditing]);

  const fetchClient = async (clientId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', Number(clientId))
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          cep: data.cep || '',
          address: data.address || '',
          address_number: data.address_number ? String(data.address_number) : '',
          address_complement: data.address_complement || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || 'Brasil'
        });
      }
    } catch (err: any) {
      toast.error('Erro ao carregar cliente: ' + err.message);
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCepBlur = async () => {
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro || prev.address,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
          toast.success('Endereço localizado!');
        } else {
          toast.error('CEP não encontrado.');
        }
      } catch (error) {
        console.error("Erro ao buscar ViaCEP:", error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Preencha o nome do cliente.');

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cep: formData.cep,
        address: formData.address,
        address_number: formData.address_number ? Number(formData.address_number) : null,
        address_complement: formData.address_complement,
        city: formData.city,
        state: formData.state,
        country: formData.country
      };

      if (isEditing && id) {
        const { error } = await supabase.from('clients').update(payload).eq('id', Number(id));
        if (error) throw error;
        toast.success('Cliente atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('clients').insert([payload]);
        if (error) throw error;
        toast.success('Cliente cadastrado com sucesso!');
      }
      navigate('/clients');
    } catch (err: any) {
      toast.error('Erro ao salvar cliente: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando dados do cliente...</p>
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
            onClick={() => navigate('/clients')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="Voltar para Clientes"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Clientes</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isEditing ? 'Editar Cadastro de Cliente' : 'Novo Cadastro de Cliente'}
            </h1>
          </div>
        </div>

        {/* CARD ÚNICO CONSOLIDADO DO FORMULÁRIO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
          
          {/* Seção 1: Identificação & Contato */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <User size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Identificação & Contato</h2>
                <p className="text-xs text-slate-500">Nome completo, e-mail e telefone de contato</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome Completo / Razão Social *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  placeholder="Ex: João da Silva / Silva Comércio LTDA"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                    placeholder="cliente@email.com"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                    placeholder="(11) 99999-9999"
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço de Entrega */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <MapPin size={17} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Endereço de Entrega</h2>
                <p className="text-xs text-slate-500">Busca automática por CEP e dados do logradouro</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  CEP (Auto-completar)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    onBlur={handleCepBlur}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                    placeholder="00000-000"
                  />
                  {loadingCep && <Loader2 className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" size={16} />}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Logradouro / Endereço
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  placeholder="Rua, Avenida, Alameda..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Número
                </label>
                <input
                  type="text"
                  name="address_number"
                  value={formData.address_number}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Complemento
                </label>
                <input
                  type="text"
                  name="address_complement"
                  value={formData.address_complement}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                  placeholder="Apto 4B, Bloco A..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Cidade / UF
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-medium transition-colors"
                    placeholder="Cidade"
                  />
                  <input
                    type="text"
                    name="state"
                    maxLength={2}
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-16 px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm bg-white font-semibold text-center uppercase transition-colors"
                    placeholder="UF"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RODAPÉ DO CARD COM AÇÕES À DIREITA */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/clients')}
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
              <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar Cliente' : 'Salvar Cliente')}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
