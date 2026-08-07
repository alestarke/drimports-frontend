import { useState, useEffect } from 'react';
import { 
  Plus, 
  Building2, 
  Building, 
  CreditCard, 
  Wallet, 
  Edit, 
  Trash2, 
  RefreshCw,
  Search,
  DollarSign
} from 'lucide-react';
import { financialService, FinancialAccount } from '../../services/financialService';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function FinancialAccounts() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'checking' | 'savings' | 'investment' | 'cash' | 'credit_card'>('checking');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [color, setColor] = useState('#059669');

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await financialService.getAccounts();
      setAccounts(data);
    } catch (error: any) {
      toast.error('Erro ao carregar contas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleOpenModal = (account?: FinancialAccount) => {
    if (account) {
      setEditingAccount(account);
      setName(account.name);
      setType(account.type);
      setInitialBalance(account.initial_balance || 0);
      setColor(account.color || '#059669');
    } else {
      setEditingAccount(null);
      setName('');
      setType('checking');
      setInitialBalance(0);
      setColor('#059669');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome da conta');
      return;
    }

    try {
      if (editingAccount) {
        await financialService.updateAccount(editingAccount.id, {
          name,
          type,
          initial_balance: Number(initialBalance),
          color
        });
        toast.success('Conta atualizada com sucesso!');
      } else {
        await financialService.createAccount({
          name,
          type,
          initial_balance: Number(initialBalance),
          color,
          icon: type === 'credit_card' ? 'CreditCard' : 'Building2'
        });
        toast.success('Conta criada com sucesso!');
      }
      setIsModalOpen(false);
      loadAccounts();
    } catch (error: any) {
      toast.error('Erro ao salvar conta: ' + error.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: `Excluir "${name}"?`,
      text: "As transações vinculadas a esta conta permanecerão sem conta associada.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await financialService.deleteAccount(id);
        toast.success('Conta excluída com sucesso!');
        loadAccounts();
      } catch (error: any) {
        toast.error('Erro ao excluir conta: ' + error.message);
      }
    }
  };

  const getBankIcon = (accountName: string, accountType: string) => {
    const lowerName = accountName.toLowerCase();
    if (lowerName.includes('nubank')) return <Building2 className="text-purple-600" size={24} />;
    if (lowerName.includes('mercado')) return <CreditCard className="text-sky-500" size={24} />;
    if (lowerName.includes('caixa')) return <Building className="text-blue-700" size={24} />;
    if (accountType === 'cash') return <Wallet className="text-emerald-600" size={24} />;
    return <Building2 className="text-emerald-600" size={24} />;
  };

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = accounts.reduce((acc, a) => acc + (a.initial_balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-emerald-600" size={28} />
            Contas Bancárias & Carteiras
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie suas contas pessoais e empresariais (Nubank, Mercado Pago, Caixa, etc.)
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-emerald-600/20 text-sm"
        >
          <Plus size={18} />
          Nova Conta
        </button>
      </div>

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total em Contas</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contas Cadastradas</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{accounts.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Building2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status do Sistema</p>
            <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronizado
            </p>
          </div>
          <button onClick={loadAccounts} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Busca & Filtro */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar conta por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Lista de Contas em Grid de Cards */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-2" size={32} />
          <p className="text-slate-500 font-medium">Carregando contas...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <Building2 className="text-slate-300 mx-auto mb-3" size={48} />
          <p className="text-slate-700 font-semibold text-lg">Nenhuma conta cadastrada</p>
          <p className="text-slate-400 text-sm mt-1">Clique em "Nova Conta" para cadastrar seu primeiro banco ou carteira.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((account) => (
            <div 
              key={account.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group"
            >
              {/* Faixa colorida no topo */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: account.color || '#059669' }}
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    {getBankIcon(account.name, account.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{account.name}</h3>
                    <span className="inline-block text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                      {account.type === 'checking' && 'Conta Corrente'}
                      {account.type === 'savings' && 'Poupança'}
                      {account.type === 'investment' && 'Investimentos'}
                      {account.type === 'cash' && 'Dinheiro em Espécie'}
                      {account.type === 'credit_card' && 'Cartão de Crédito'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(account)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(account.id, account.name)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Saldo Inicial</span>
                <span className="text-lg font-black text-slate-900">
                  R$ {(account.initial_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Criar/Editar Conta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária / Carteira'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Conta / Banco *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Mercado Pago, Caixa..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Conta *
                </label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Poupança</option>
                  <option value="investment">Investimentos</option>
                  <option value="cash">Dinheiro em Espécie / Carteira</option>
                  <option value="credit_card">Cartão de Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Saldo Inicial (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cor Visual de Identificação
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-1"
                  />
                  <span className="text-xs text-slate-500 font-mono">{color}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all"
                >
                  {editingAccount ? 'Atualizar' : 'Salvar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
