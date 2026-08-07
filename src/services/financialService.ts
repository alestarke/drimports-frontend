import { supabase } from '../supabaseClient';

export interface FinancialAccount {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'cash' | 'credit_card';
  initial_balance: number;
  color?: string;
  icon?: string;
  created_at?: string;
  deleted_at?: string | null;
}

export interface FinancialModality {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  color?: string;
  icon?: string;
  is_system?: boolean;
  created_at?: string;
  deleted_at?: string | null;
}

export interface FinancialTransaction {
  id?: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  modality_id?: number | null;
  account_id?: number | null;
  due_date: string;
  payment_date?: string | null;
  status: 'pending' | 'paid' | 'canceled';
  receipt_url?: string | null;
  receipt_name?: string | null;
  notes?: string | null;
  created_at?: string;
  deleted_at?: string | null;

  // Relações carregadas via join
  modality?: FinancialModality;
  account?: FinancialAccount;
}

export const financialService = {
  // --- CONTAS BANCÁRIAS ---
  async getAccounts(): Promise<FinancialAccount[]> {
    const { data, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createAccount(account: Omit<FinancialAccount, 'id'>): Promise<FinancialAccount> {
    const { data, error } = await supabase
      .from('financial_accounts')
      .insert([account])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAccount(id: number, account: Partial<FinancialAccount>): Promise<FinancialAccount> {
    const { data, error } = await supabase
      .from('financial_accounts')
      .update(account)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAccount(id: number): Promise<void> {
    // Soft delete: define deleted_at com a data atual
    const { error } = await supabase
      .from('financial_accounts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  // --- MODALIDADES / CATEGORIAS ---
  async getModalities(type?: 'income' | 'expense'): Promise<FinancialModality[]> {
    let query = supabase
      .from('financial_modalities')
      .select('*')
      .is('deleted_at', null);
    
    if (type) {
      query = query.or(`type.eq.${type},type.eq.both`);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createModality(modality: Omit<FinancialModality, 'id'>): Promise<FinancialModality> {
    const { data, error } = await supabase
      .from('financial_modalities')
      .insert([modality])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateModality(id: number, modality: Partial<FinancialModality>): Promise<FinancialModality> {
    const { data, error } = await supabase
      .from('financial_modalities')
      .update(modality)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteModality(id: number): Promise<void> {
    // Soft delete: define deleted_at com a data atual
    const { error } = await supabase
      .from('financial_modalities')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  // --- TRANSAÇÕES ---
  async getTransactions(filters?: {
    type?: 'income' | 'expense';
    status?: string;
    accountId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<FinancialTransaction[]> {
    let query = supabase
      .from('financial_transactions')
      .select('*, modality:modality_id(*), account:account_id(*)')
      .is('deleted_at', null);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId);
    }
    if (filters?.startDate) {
      query = query.gte('due_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('due_date', filters.endDate);
    }

    const { data, error } = await query.order('due_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createTransaction(transaction: Omit<FinancialTransaction, 'id'>): Promise<FinancialTransaction> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTransaction(id: number, transaction: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update(transaction)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTransaction(id: number): Promise<void> {
    // Soft delete: define deleted_at com a data atual
    const { error } = await supabase
      .from('financial_transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  // --- STORAGE: COMPROVANTES ---
  async uploadReceipt(file: File): Promise<{ publicUrl: string; fileName: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return {
      publicUrl: data.publicUrl,
      fileName: file.name,
    };
  }
};
