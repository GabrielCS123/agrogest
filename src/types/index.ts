export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  acceptedTerms: boolean;
}

export interface Property {
  id: string;
  userId: string;
  propertyName: string;
  productionType: string;
  area: number;
  city: string;
  state: string;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: string;
  value: number;
  description: string;
  transactionDate: string; // ISO string format (YYYY-MM-DD)
  createdAt: string;
}

export interface AIReport {
  id: string;
  userId: string;
  prompt: string;
  response: string;
  createdAt: string;
}

export interface ExpenseCategory {
  value: string;
  label: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { value: 'Ração', label: 'Ração' },
  { value: 'Combustível', label: 'Combustível' },
  { value: 'Fertilizante', label: 'Fertilizante' },
  { value: 'Medicamentos', label: 'Medicamentos' },
  { value: 'Mão de obra', label: 'Mão de obra' },
  { value: 'Outros', label: 'Outros' }
];

export interface IncomeCategory {
  value: string;
  label: string;
}

export const INCOME_CATEGORIES: IncomeCategory[] = [
  { value: 'Venda de Produção', label: 'Venda de Produção' },
  { value: 'Venda de Animais', label: 'Venda de Animais' },
  { value: 'Serviços Prestados', label: 'Serviços Prestados' },
  { value: 'Subsídios/Apoios', label: 'Subsídios/Apoios' },
  { value: 'Outros', label: 'Outros' }
];
