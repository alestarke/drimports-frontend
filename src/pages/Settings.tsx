import { useState, useEffect } from 'react';
import { User, Building, Settings as SettingsIcon, ShieldAlert, Save, Download, Trash2, Loader2, Key } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'company' | 'advanced'>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estados dos Formulários
  const [profileData, setProfileData] = useState({ name: '', email: '', newPassword: '' });
  const [prefData, setPrefData] = useState({ stockAlert: '5', defaultDollar: '5.00' });
  const [companyData, setCompanyData] = useState({ name: '', cnpj: '', phone: '' });

  useEffect(() => {
    fetchUserData();
    loadLocalSettings();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        setCurrentUser(profile);
        setProfileData({ name: profile?.name || '', email: authUser.email || '', newPassword: '' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalSettings = () => {
    const savedPrefs = localStorage.getItem('drimports_prefs');
    const savedCompany = localStorage.getItem('drimports_company');
    if (savedPrefs) setPrefData(JSON.parse(savedPrefs));
    if (savedCompany) setCompanyData(JSON.parse(savedCompany));
  };

  // --- HANDLERS DE SALVAMENTO ---

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Atualiza o nome na tabela pública
      if (currentUser) {
        await supabase.from('users').update({ name: profileData.name }).eq('id', currentUser.id);
      }
      
      // 2. Atualiza a senha no Auth (se preenchida)
      if (profileData.newPassword) {
        if (profileData.newPassword.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres.");
        const { error: authError } = await supabase.auth.updateUser({ password: profileData.newPassword });
        if (authError) throw authError;
        setProfileData(prev => ({ ...prev, newPassword: '' })); 
      }

      toast.success('Perfil atualizado com sucesso!');
      fetchUserData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('drimports_prefs', JSON.stringify(prefData));
    toast.success('Preferências salvas!');
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('drimports_company', JSON.stringify(companyData));
    toast.success('Dados da empresa salvos!');
  };

  // --- FUNÇÕES AVANÇADAS ---

  const handleExportCSV = async () => {
    try {
      const { data, error } = await supabase.from('sales').select('*, product:product_id(name)').is('deleted_at', null);
      if (error) throw error;
      if (!data || data.length === 0) return toast.error('Não há dados para exportar.');

      // Monta o CSV simples
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Data,Produto,Tipo,Quantidade,Valor Total\n";

      data.forEach(row => {
        csvContent += `${row.id},${row.sale_date},"${row.product?.name || ''}",${row.type},${row.quantity},${row.total_price}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download iniciado!');
    } catch (error: any) {
      toast.error('Erro ao exportar: ' + error.message);
    }
  };

  const handleFactoryReset = async () => {
    if (!currentUser?.is_admin) return toast.error('Apenas administradores podem fazer isso.');

    const result = await Swal.fire({
      title: 'Zerar Banco de Dados?',
      text: "Isso apagará TODAS as vendas e importações. Os produtos e usuários serão mantidos. Essa ação não pode ser desfeita!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, apagar tudo!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      // Aqui você colocaria a lógica de Hard Delete ou Soft Delete em massa.
      // Exemplo: await supabase.from('sales').delete().neq('id', 0);
      toast.success('Simulação: Dados apagados com sucesso.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
        <p className="text-gray-500">Gerencie suas preferências, perfil e dados do sistema.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* MENU LATERAL DE ABAS */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-fit flex-shrink-0">
          <nav className="flex flex-col">
            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
              <User size={18} /> Meu Perfil
            </button>
            <button onClick={() => setActiveTab('preferences')} className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
              <SettingsIcon size={18} /> Preferências
            </button>
            <button onClick={() => setActiveTab('company')} className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'company' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
              <Building size={18} /> Dados da Empresa
            </button>
            {currentUser?.is_admin && (
              <button onClick={() => setActiveTab('advanced')} className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'advanced' ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
                <ShieldAlert size={18} /> Avançado
              </button>
            )}
          </nav>
        </div>

        {/* CONTEÚDO PRINCIPAL (DInâmico) */}
        <div className="flex-1">
          
          {/* TAB: PERFIL */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Informações Pessoais</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Login)</label>
                  <input type="email" value={profileData.email} disabled className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed" />
                </div>
                
                <h3 className="text-md font-bold text-gray-800 mt-8 mb-2 flex items-center gap-2"><Key size={16}/> Segurança</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha (opcional)</label>
                  <input type="password" placeholder="Deixe em branco para não alterar" value={profileData.newPassword} onChange={e => setProfileData({...profileData, newPassword: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Perfil
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: PREFERÊNCIAS */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Padrões do Sistema</h2>
              <form onSubmit={handleSavePreferences} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alerta de Estoque Baixo (unidades)</label>
                  <p className="text-xs text-gray-500 mb-2">O dashboard avisará quando um produto atingir esta quantidade.</p>
                  <input type="number" min="1" value={prefData.stockAlert} onChange={e => setPrefData({...prefData, stockAlert: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cotação Padrão do Dólar (R$)</label>
                  <p className="text-xs text-gray-500 mb-2">Valor sugerido automaticamente ao registrar novas importações.</p>
                  <input type="number" step="0.01" value={prefData.defaultDollar} onChange={e => setPrefData({...prefData, defaultDollar: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>

                <div className="pt-4">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Save size={18} /> Salvar Preferências
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: EMPRESA */}
          {activeTab === 'company' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Identidade do Negócio</h2>
              <form onSubmit={handleSaveCompany} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia / Razão Social</label>
                  <input type="text" value={companyData.name} onChange={e => setCompanyData({...companyData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Dr. Imports Eletrônicos" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ / CPF</label>
                    <input type="text" value={companyData.cnpj} onChange={e => setCompanyData({...companyData, cnpj: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                    <input type="text" value={companyData.phone} onChange={e => setCompanyData({...companyData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Save size={18} /> Atualizar Dados
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: AVANÇADO */}
          {activeTab === 'advanced' && currentUser?.is_admin && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">Exportar Dados</h2>
                <p className="text-sm text-gray-500 mb-4">Faça o download do seu histórico financeiro e de vendas para abrir no Excel ou Google Sheets.</p>
                <button onClick={handleExportCSV} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
                  <Download size={18} /> Exportar Vendas (.csv)
                </button>
              </div>

              <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-6">
                <h2 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2"><ShieldAlert size={20} /> Zona de Perigo</h2>
                <p className="text-sm text-red-600 mb-4">Ações destrutivas. Tenha certeza absoluta antes de prosseguir.</p>
                <button onClick={handleFactoryReset} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors shadow-sm">
                  <Trash2 size={18} /> Zerar Banco de Dados
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}