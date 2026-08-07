import { useState, useEffect, useRef } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Tag, 
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { 
  financialService, 
  FinancialTransaction, 
  FinancialAccount, 
  FinancialModality 
} from '../../services/financialService';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function FinancialTransactions() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [modalities, setModalities] = useState<FinancialModality[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'canceled'>('all');
  const [filterAccount, setFilterAccount] = useState<number | 'all'>('all');

  // Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);

  // Form Fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [modalityId, setModalityId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'paid' | 'pending' | 'canceled'>('paid');
  const [notes, setNotes] = useState('');
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [existingReceiptName, setExistingReceiptName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Receipt Modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      toast.error('Erro ao carregar transações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (tx?: FinancialTransaction) => {
    if (tx) {
      setEditingTx(tx);
      setDescription(tx.description);
      setAmount(tx.amount);
      setType(tx.type);
      setModalityId(tx.modality_id || '');
      setAccountId(tx.account_id || '');
      setDueDate(tx.due_date);
      setPaymentDate(tx.payment_date || tx.due_date);
      setStatus(tx.status);
      setNotes(tx.notes || '');
      setExistingReceiptUrl(tx.receipt_url || null);
      setExistingReceiptName(tx.receipt_name || null);
    } else {
      setEditingTx(null);
      setDescription('');
      setAmount('');
      setType('expense');
      setModalityId('');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setDueDate(new Date().toISOString().split('T')[0]);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setStatus('paid');
      setNotes('');
      setExistingReceiptUrl(null);
      setExistingReceiptName(null);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Informe a descrição da transação');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    try {
      setUploading(true);
      let receiptUrl = existingReceiptUrl;
      let receiptName = existingReceiptName;

      // Se houver novo arquivo selecionado, fazer upload para Supabase Storage
      if (selectedFile) {
        const uploadRes = await financialService.uploadReceipt(selectedFile);
        receiptUrl = uploadRes.publicUrl;
        receiptName = uploadRes.fileName;
      }

      const payload: Omit<FinancialTransaction, 'id'> = {
        description,
        amount: Number(amount),
        type,
        modality_id: modalityId ? Number(modalityId) : null,
        account_id: type === 'income' && accountId ? Number(accountId) : null,
        due_date: paymentDate || dueDate,
        payment_date: status === 'paid' ? paymentDate : null,
        status,
        receipt_url: receiptUrl,
        receipt_name: receiptName,
        notes
      };

      if (editingTx && editingTx.id) {
        await financialService.updateTransaction(editingTx.id, payload);
        toast.success('Transação atualizada!');
      } else {
        await financialService.createTransaction(payload);
        toast.success('Transação cadastrada com sucesso!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Erro ao salvar transação: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, desc: string) => {
    const result = await Swal.fire({
      title: `Excluir "${desc}"?`,
      text: "Esta ação é permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await financialService.deleteTransaction(id);
        toast.success('Transação excluída!');
        loadData();
      } catch (error: any) {
        toast.error('Erro ao excluir: ' + error.message);
      }
    }
  };

  // Filtragem
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.modality?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    const matchesAccount = filterAccount === 'all' || tx.account_id === filterAccount;

    return matchesSearch && matchesType && matchesStatus && matchesAccount;
  });

  // Totais
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="text-emerald-600" size={28} />
            Transações & Gastos (Receitas e Despesas)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lance e acompanhe receitas, gastos por modalidade e anexe comprovantes de pagamento
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-emerald-600/20 text-sm"
        >
          <Plus size={18} />
          Nova Transação
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receitas (Pagas)</p>
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gastos/Despesas (Pagas)</p>
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Balanço do Período</p>
            <p className={`text-2xl font-black mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Filter size={20} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo */}
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">Todos os Tipos</option>
            <option value="expense">Despesas</option>
            <option value="income">Receitas</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e: any) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">Todos os Status</option>
            <option value="paid">Pagos / Concluídos</option>
            <option value="pending">Pendentes</option>
            <option value="canceled">Cancelados</option>
          </select>

          {/* Conta */}
          <select
            value={filterAccount}
            onChange={(e: any) => setFilterAccount(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">Todas as Contas</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>

          <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-2" size={32} />
            <p className="text-slate-500 font-medium">Carregando transações...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 p-6">
            <Receipt className="text-slate-300 mx-auto mb-3" size={48} />
            <p className="text-slate-700 font-semibold text-lg">Nenhuma transação encontrada</p>
            <p className="text-slate-400 text-sm mt-1">Clique em "Nova Transação" para fazer um lançamento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4">Modalidade</th>
                  <th className="py-3.5 px-4">Conta</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Comprovante</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        {tx.type === 'income' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                        )}
                        <span>{tx.description}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {tx.modality ? (
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-white shadow-2xs"
                          style={{ backgroundColor: tx.modality.color || '#64748b' }}
                        >
                          <Tag size={12} />
                          {tx.modality.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Sem categoria</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={15} className="text-slate-400" />
                        {tx.account?.name || 'Não especificada'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date((tx.type === 'income' ? (tx.payment_date || tx.due_date) : tx.due_date) + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4">
                      {tx.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          <CheckCircle2 size={13} />
                          {tx.type === 'income' ? 'Recebido' : 'Pago'}
                        </span>
                      ) : tx.status === 'canceled' ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          <X size={13} />
                          Cancelado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          <Clock size={13} />
                          Pendente
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {tx.receipt_url ? (
                        <button
                          onClick={() => setPreviewUrl(tx.receipt_url!)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                        >
                          <FileText size={13} />
                          Anexo
                          <Eye size={12} />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-black ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenModal(tx)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id!, tx.description)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {editingTx ? 'Editar Transação' : 'Nova Transação (Receita ou Gasto)'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2.5 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
                    type === 'expense' 
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <TrendingDown size={18} />
                  Despesa / Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2.5 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
                    type === 'income' 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp size={18} />
                  Receita / Entrada
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de Mercadoria, Aluguel, Supermercado..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="paid">{type === 'income' ? 'Recebido' : 'Pago / Concluído'}</option>
                    <option value="pending">Pendente</option>
                    <option value="canceled">Cancelado</option>
                  </select>
                </div>
              </div>

              {type === 'income' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Categoria
                    </label>
                    <select
                      value={modalityId}
                      onChange={(e: any) => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setModalityId(val);
                        if (val) {
                          const foundMod = modalities.find(m => m.id === val);
                          if (foundMod && (foundMod.type === 'income' || foundMod.type === 'expense')) {
                            setType(foundMod.type);
                          }
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="">Selecione...</option>
                      {modalities
                        .filter(m => m.type === type || m.type === 'both')
                        .map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Conta Bancária
                    </label>
                    <select
                      value={accountId}
                      onChange={(e: any) => setAccountId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="">Selecione...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    value={modalityId}
                    onChange={(e: any) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      setModalityId(val);
                      if (val) {
                        const foundMod = modalities.find(m => m.id === val);
                        if (foundMod && (foundMod.type === 'income' || foundMod.type === 'expense')) {
                          setType(foundMod.type);
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Selecione...</option>
                    {modalities
                      .filter(m => m.type === type || m.type === 'both')
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* Data da Transação (Única para Receitas e Despesas) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {type === 'income' ? 'Data do Recebimento *' : 'Data do Pagamento *'}
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => {
                    setPaymentDate(e.target.value);
                    setDueDate(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-medium"
                />
              </div>

              {/* Upload do Comprovante */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Comprovante de Pagamento
                </label>

                {existingReceiptUrl && !selectedFile && (
                  <div className="mb-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                      <FileText size={16} />
                      <span className="truncate max-w-[200px]">{existingReceiptName || 'Comprovante Anexado'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExistingReceiptUrl(null)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                )}

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 p-4 rounded-xl text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition-colors"
                >
                  <Upload size={24} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar PDF ou Imagem do comprovante'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Formatos suportados: PNG, JPG, PDF (Máx: 5MB)</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
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
                  disabled={uploading}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {uploading && <RefreshCw size={14} className="animate-spin" />}
                  {editingTx ? 'Atualizar Transação' : 'Salvar Transação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview do Comprovante */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                Visualizador de Comprovante
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={14} /> Abrir em nova aba
                </a>
                <button onClick={() => setPreviewUrl(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="h-[500px] w-full flex items-center justify-center bg-slate-100 rounded-xl overflow-hidden">
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-full" title="Comprovante PDF" />
              ) : (
                <img src={previewUrl} alt="Comprovante" className="max-h-full max-w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
