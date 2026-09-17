import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Printer, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Receipt, 
  Tag, 
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { 
  financialService, 
  FinancialTransaction, 
  FinancialAccount, 
  FinancialModality 
} from '../../services/financialService';
import toast from 'react-hot-toast';

export default function FinancialReports() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [modalities, setModalities] = useState<FinancialModality[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro de Mês e Ano
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txs, accs, mods] = await Promise.all([
        financialService.getTransactions(),
        financialService.getAccounts(),
        financialService.getModalities()
      ]);
      setTransactions(txs);
      setAccounts(accs);
      setModalities(mods);
    } catch (error: any) {
      toast.error('Erro ao carregar dados do relatório: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtragem das transações para o mês/ano selecionado
  const monthTransactions = transactions.filter(tx => {
    const txDateStr = tx.type === 'income' ? (tx.payment_date || tx.due_date) : tx.due_date;
    if (!txDateStr) return false;
    
    const [yearStr, monthStr] = txDateStr.split('-');
    const txYear = parseInt(yearStr, 10);
    const txMonth = parseInt(monthStr, 10) - 1;

    return txYear === selectedYear && txMonth === selectedMonth;
  });

  // Totais do Mês Selecionado
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Gastos agrupados por Modalidade no mês
  const expenseModalityTotals = modalities
    .filter(m => m.type === 'expense' || m.type === 'both')
    .map(mod => {
      const modExpenses = monthTransactions.filter(
        t => t.type === 'expense' && t.status === 'paid' && t.modality_id === mod.id
      );
      const amount = modExpenses.reduce((acc, t) => acc + t.amount, 0);
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;

      return {
        ...mod,
        amount,
        percentage,
        count: modExpenses.length
      };
    })
    .filter(m => m.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Ação de Impressão/Gerar PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Estilos específicos de impressão para PDF em múltiplas páginas sem cortes */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          html, body, #root, #root > div, div, main, article {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            overflow-y: visible !important;
            position: static !important;
            float: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, aside, header, .no-print, button {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
        }
      `}</style>

      {/* Header com Filtros e Ação (oculto na impressão) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" size={28} />
            Relatório Financeiro Mensal (PDF)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Selecione um mês para visualizar o balanço, gráficos de gastos e exportar o relatório oficial em PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Mês */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <Calendar size={18} className="text-slate-500 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none pr-1"
            >
              {months.map((monthName, idx) => (
                <option key={idx} value={idx}>{monthName}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none"
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-emerald-600/20 text-sm active:scale-95"
          >
            <Printer size={18} />
            Exportar PDF / Imprimir
          </button>
        </div>
      </div>

      {/* --- ÁREA IMPRESSA DO RELATÓRIO PDF --- */}
      <div className="print-container space-y-6">

        {/* Cabeçalho do Relatório Impresso */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between avoid-break">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                DR.
              </span>
              <span className="text-xl font-bold tracking-[0.15em] text-white">
                FINANCE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Relatório Consolidado de Gastos & Receitas • {months[selectedMonth]} / {selectedYear}
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="font-semibold text-emerald-400 mt-0.5">Status: Fechamento Mensal</p>
          </div>
        </div>

        {/* Cards de Resumo do Mês */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 avoid-break">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entradas ({months[selectedMonth]})</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saídas / Gastos ({months[selectedMonth]})</p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resultado Líquido</p>
              <p className={`text-2xl font-black mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Filter size={20} />
            </div>
          </div>
        </div>

        {/* Gráfico / Distribuição de Gastos por Categoria no Mês */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs avoid-break">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Tag className="text-emerald-600" size={20} />
            Distribuição dos Gastos por Categoria ({months[selectedMonth]} / {selectedYear})
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Gráfico de proporção dos custos no mês selecionado
          </p>

          {expenseModalityTotals.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm italic">
              Nenhum gasto registrado para o mês de {months[selectedMonth]} / {selectedYear}.
            </div>
          ) : (
            <div className="space-y-4">
              {expenseModalityTotals.map(mod => (
                <div key={mod.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-800">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: mod.color || '#10b981' }} />
                      {mod.name}
                      <span className="text-slate-400 font-normal">({mod.count} lançamento{mod.count > 1 ? 's' : ''})</span>
                    </span>
                    <div className="text-right">
                      <span className="text-slate-900 font-black mr-2">
                        R$ {mod.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-slate-500 font-semibold">
                        ({mod.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  {/* Barra Visual */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${mod.percentage}%`,
                        backgroundColor: mod.color || '#10b981'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabela com Todo o Histórico do Mês Selecionado */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="text-emerald-600" size={18} />
              Histórico Completo de Lançamentos do Mês ({monthTransactions.length} registros)
            </h2>
          </div>

          {monthTransactions.length === 0 ? (
            <div className="text-center py-12 p-6">
              <Receipt className="text-slate-300 mx-auto mb-3" size={48} />
              <p className="text-slate-700 font-semibold text-base">Sem registros em {months[selectedMonth]} de {selectedYear}</p>
              <p className="text-slate-400 text-xs mt-1">Nenhuma receita ou gasto foi cadastrado nesta data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {new Date((tx.type === 'income' ? (tx.payment_date || tx.due_date) : tx.due_date) + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{tx.description}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {tx.modality ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-white shadow-2xs"
                            style={{ backgroundColor: tx.modality.color || '#64748b' }}
                          >
                            {tx.modality.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Sem categoria</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {tx.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold">
                            <CheckCircle2 size={12} />
                            {tx.type === 'income' ? 'Recebido' : 'Pago'}
                          </span>
                        ) : tx.status === 'canceled' ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            <X size={12} />
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold">
                            <Clock size={12} />
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className={`py-3 px-4 text-right font-black ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
