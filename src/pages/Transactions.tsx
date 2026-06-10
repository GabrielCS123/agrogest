import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { 
  getTransactions, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction 
} from '../services/dbService';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES, TransactionType } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText, 
  DollarSign, 
  Search,
  Filter,
  X,
  AlertCircle
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States para Modais e CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Filtros
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form hook
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  
  const selectedType = watch('type', 'income') as TransactionType;

  // Carregar transações
  const loadTransactions = async () => {
    if (!user) return;
    try {
      const data = await getTransactions(user.uid);
      setTransactions(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao carregar movimentações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  // Abrir modal para Adicionar
  const handleOpenAdd = () => {
    setEditingTransaction(null);
    reset({
      type: 'income',
      category: INCOME_CATEGORIES[0].value,
      value: '',
      transactionDate: new Date().toISOString().split('T')[0],
      description: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal para Editar
  const handleOpenEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    reset({
      type: transaction.type,
      category: transaction.category,
      value: transaction.value,
      transactionDate: transaction.transactionDate,
      description: transaction.description
    });
    setIsModalOpen(true);
  };

  // Quando mudar o tipo de transação no Form, atualiza a categoria padrão correspondente
  useEffect(() => {
    if (!editingTransaction) {
      if (selectedType === 'income') {
        setValue('category', INCOME_CATEGORIES[0].value);
      } else {
        setValue('category', EXPENSE_CATEGORIES[0].value);
      }
    }
  }, [selectedType, editingTransaction, setValue]);

  // Salvar transação (criar ou atualizar)
  const onSubmit = async (data: any) => {
    if (!user) return;
    setLoading(true);
    setIsModalOpen(false);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          type: data.type,
          category: data.category,
          value: Number(data.value),
          transactionDate: data.transactionDate,
          description: data.description
        });
      } else {
        await addTransaction(user.uid, {
          type: data.type,
          category: data.category,
          value: Number(data.value),
          transactionDate: data.transactionDate,
          description: data.description
        });
      }
      await loadTransactions();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao salvar a movimentação.");
      setLoading(false);
    }
  };

  // Confirmar Exclusão
  const handleConfirmDelete = async () => {
    if (!deletingTransactionId) return;
    setLoading(true);
    try {
      await deleteTransaction(deletingTransactionId);
      await loadTransactions();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao excluir a movimentação.");
      setLoading(false);
    } finally {
      setDeletingTransactionId(null);
    }
  };

  // Filtragem local das transações carregadas
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-sans tracking-tight">Movimentações Financeiras</h1>
          <p className="text-slate-400 text-sm mt-0.5">Cadastre e gerencie as receitas e despesas da sua propriedade rural.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-3 px-5 text-white bg-emerald-600 hover:bg-emerald-700 font-bold transition-all shadow-md shadow-emerald-600/10 rounded-2xl text-xs self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4.5 w-4.5" />
          Nova Movimentação
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 text-sm text-red-700 rounded-2xl flex gap-2.5 items-start">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabela e Filtros */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Barra de Filtros */}
        <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs para Tipo */}
          <div className="flex bg-slate-50 border border-slate-200/50 p-1 rounded-2xl w-full md:w-auto self-stretch md:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                filterType === 'all' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                filterType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Receitas
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                filterType === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Despesas
            </button>
          </div>

          {/* Busca por Descrição */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
              <p className="mt-3 text-xs text-slate-400 animate-pulse font-medium">Carregando lista...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-400 text-sm font-medium">Nenhuma movimentação financeira encontrada.</p>
              <button
                onClick={handleOpenAdd}
                className="mt-3 text-emerald-600 hover:text-emerald-700 text-xs font-bold hover:underline"
              >
                Clique aqui para cadastrar a primeira
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                  <th className="py-4 px-6">Tipo</th>
                  <th className="py-4 px-6">Categoria</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Descrição</th>
                  <th className="py-4 px-6 text-right">Valor</th>
                  <th className="py-4 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
                {filteredTransactions.map((t) => {
                  const isIncome = t.type === 'income';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Tipo Icon */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isIncome 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                            : 'bg-red-50 text-red-700 border border-red-100/50'
                        }`}>
                          {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isIncome ? 'Receita' : 'Despesa'}
                        </span>
                      </td>

                      {/* Categoria */}
                      <td className="py-4 px-6 font-bold text-slate-800">{t.category}</td>

                      {/* Data */}
                      <td className="py-4 px-6 text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {t.transactionDate.split('-').reverse().join('/')}
                        </span>
                      </td>

                      {/* Descrição */}
                      <td className="py-4 px-6 text-slate-500 max-w-xs truncate" title={t.description}>
                        {t.description || <span className="italic text-slate-300">Sem observações</span>}
                      </td>

                      {/* Valor */}
                      <td className={`py-4 px-6 text-right font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'} R$ {t.value.toFixed(2)}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 rounded-lg transition-colors border border-slate-100"
                            title="Editar"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingTransactionId(t.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors border border-slate-100"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            
            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {editingTransaction ? 'Editar Movimentação' : 'Nova Movimentação'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              
              {/* Tipo */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Fluxo</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`
                    flex items-center justify-center gap-2 py-3 px-4 border rounded-2xl text-xs font-bold cursor-pointer transition-all select-none
                    ${selectedType === 'income' 
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm shadow-emerald-500/5' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }
                  `}>
                    <input 
                      type="radio" 
                      value="income"
                      {...register('type')}
                      className="sr-only"
                    />
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Receita
                  </label>
                  <label className={`
                    flex items-center justify-center gap-2 py-3 px-4 border rounded-2xl text-xs font-bold cursor-pointer transition-all select-none
                    ${selectedType === 'expense' 
                      ? 'border-red-500 bg-red-50/50 text-red-700 shadow-sm shadow-red-500/5' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }
                  `}>
                    <input 
                      type="radio" 
                      value="expense"
                      {...register('type')}
                      className="sr-only"
                    />
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Despesa
                  </label>
                </div>
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Valor (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      {...register('value')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-9 pr-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      {...register('transactionDate')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-9 pr-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Categoria</label>
                <select
                  required
                  {...register('category')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 font-medium"
                >
                  {selectedType === 'income' 
                    ? INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)
                    : EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)
                  }
                </select>
              </div>

              {/* Observações / Descrição */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Observações / Descrição</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    placeholder="Ex: Venda de 50 sacos de milho colhidos no setor sul"
                    rows={3}
                    {...register('description')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 font-medium resize-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3 justify-end border-t border-slate-50 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 bg-white border border-slate-200 transition-colors text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors text-xs font-bold shadow-md shadow-emerald-600/10"
                >
                  {editingTransaction ? 'Atualizar Saldo' : 'Registrar Saldo'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deseja excluir esta movimentação?"
        message="Esta ação apagará permanentemente o registro selecionado e recalculará os saldos gerais do seu dashboard. Não é possível desfazer."
        confirmText="Excluir Definitivamente"
        cancelText="Manter Registro"
        isDestructive={true}
      />

    </div>
  );
};

export default Transactions;
