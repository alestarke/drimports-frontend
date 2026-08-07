import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  Clock, 
  Building2, 
  Tag, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  financialService, 
  FinancialTransaction, 
  FinancialAccount, 
  FinancialModality 
} from '../../services/financialService';
import toast from 'react-hot-toast';

export default function FinancialDashboard() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [modalities, setModalities] = useState<FinancialModality[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [accs, mods, txs] = await Promise.all([
        financialService.getAccounts(),
        financialService.getModalities(),
        financialService.getTransactions()
      ]);
      setAccounts(accs);
      setModalities(mods);
      setTransactions(txs);
    } catch (error: any) {
      toast.error('Erro ao carregar dados do Dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Cálculos de Indicadores
  const totalBalance = accounts.reduce((acc, a) => acc + (a.initial_balance || 0), 0);

  const incomeTxs = transactions.filter(t => t.type === 'income' && t.status === 'paid');
  const expenseTxs = transactions.filter(t => t.type === 'expense' && t.status === 'paid');

  const totalIncome = incomeTxs.reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = expenseTxs.reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const pendingExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  // Agrupamento por Modalidade para Gráfico/Barra de Distribuição
  const expensesByModality = modalities
    .filter(m => m.type === 'expense' || m.type === 'both')
    .map(m => {
      const total = transactions
        .filter(t => t.modality_id === m.id && t.type === 'expense' && t.status === 'paid')
        .reduce((acc, t) => acc + t.amount, 0);
      return { ...m, total };
    })
    .filter(m => m.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Painel Geral
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Controle Financeiro & Gastos Pessoais
          </h1>
          <p className="text-sm text-slate-500">
            Resumo de caixa, contas bancárias e gastos por modalidade
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/financeiro/transacoes')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-emerald-600/20 text-sm"
          >
            <Plus size={18} />
            Novo Lançamento
          </button>
          <button
            onClick={loadDashboardData}
            className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors border border-slate-200"
            title="Atualizar dados"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Cards Principais de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receitas Totais</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-3">
            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-700">
            <ArrowUpRight size={14} />
            <span>Entradas confirmadas</span>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos / Despesas</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-3">
            R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-rose-700">
            <ArrowDownRight size={14} />
            <span>Saídas efetuadas</span>
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balanço do Mês</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
          <p className={`text-2xl font-black mt-3 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-400 font-medium block mt-2">Receitas - Gastos</span>
        </div>

        {/* Contas a Pagar (Pendentes) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendentes a Pagar</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-3">
            R$ {pendingExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-amber-700 font-semibold block mt-2">Aguardando pagamento</span>
        </div>
      </div>

      {/* Seção Central: Distribuição de Gastos e Contas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gastos por Modalidade (2 Colunas) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Tag size={20} className="text-emerald-600" />
                Gastos por Modalidade / Categoria
              </h2>
              <p className="text-xs text-slate-400">Distribuição dos custos pessoais e operacionais</p>
            </div>
            <button 
              onClick={() => navigate('/financeiro/modalidades')}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Gerenciar Modalidades
            </button>
          </div>

          {expensesByModality.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Nenhuma despesa lançada no período para exibir no gráfico.
            </div>
          ) : (
            <div className="space-y-4">
              {expensesByModality.map(m => {
                const percentage = totalExpense > 0 ? (m.total / totalExpense) * 100 : 0;
                return (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: m.color || '#64748b' }} 
                        />
                        {m.name}
                      </span>
                      <span className="text-slate-900">
                        R$ {m.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: m.color || '#059669' 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Saldos por Conta (1 Coluna) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-emerald-600" />
                Minhas Contas
              </h2>
              <button 
                onClick={() => navigate('/financeiro/contas')}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Ver Todas
              </button>
            </div>

            <div className="space-y-3">
              {accounts.map(acc => (
                <div 
                  key={acc.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-10 rounded-md"
                      style={{ backgroundColor: acc.color || '#059669' }}
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{acc.name}</h4>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">{acc.type}</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-sm">
                    R$ {(acc.initial_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total em Bancos</span>
            <span className="text-base font-black text-emerald-600">
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Útimos Lançamentos */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Receipt size={20} className="text-emerald-600" />
            Últimas Transações Registradas
          </h2>
          <button 
            onClick={() => navigate('/financeiro/transacoes')}
            className="text-xs font-bold text-emerald-600 hover:underline"
          >
            Ver Histórico Completo
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.slice(0, 5).map(tx => (
            <div key={tx.id} className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{tx.description}</p>
                  <p className="text-xs text-slate-400">
                    {tx.modality?.name || 'Sem categoria'} • {new Date(tx.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <span className={`font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
