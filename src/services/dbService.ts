import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Property, Transaction, AIReport } from '../types';

// --- SERVIÇO DE PROPRIEDADE ---
export const getProperty = async (userId: string): Promise<Property | null> => {
  try {
    const q = query(collection(db, 'properties'), where('userId', '==', userId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Property;
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter propriedade:", error);
    throw error;
  }
};

export const saveProperty = async (userId: string, propertyData: Omit<Property, 'id' | 'userId' | 'createdAt'>): Promise<void> => {
  try {
    const q = query(collection(db, 'properties'), where('userId', '==', userId), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Atualizar existente
      const existingDoc = querySnapshot.docs[0];
      const docRef = doc(db, 'properties', existingDoc.id);
      await updateDoc(docRef, {
        ...propertyData,
        area: Number(propertyData.area)
      });
    } else {
      // Criar nova
      await addDoc(collection(db, 'properties'), {
        userId,
        ...propertyData,
        area: Number(propertyData.area),
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Erro ao salvar propriedade:", error);
    throw error;
  }
};

// --- SERVIÇO DE TRANSAÇÕES (MOVIMENTAÇÕES) ---
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    // Nota: usar orderBy junto com where exige índice composto no Firestore.
    // Para evitar a necessidade de índices (plano gratuito), buscamos todos os
    // documentos do usuário e ordenamos localmente no cliente.
    const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((docSnap) => {
      transactions.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
    });
    // Ordenar por data da transação (mais recente primeiro) no cliente
    transactions.sort((a, b) => {
      const dateA = a.transactionDate || a.createdAt || '';
      const dateB = b.transactionDate || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
    return transactions;
  } catch (error) {
    console.error("Erro ao obter transações:", error);
    throw error;
  }
};

export const addTransaction = async (userId: string, transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      userId,
      ...transactionData,
      value: Number(transactionData.value),
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar transação:", error);
    throw error;
  }
};

export const updateTransaction = async (transactionId: string, transactionData: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'transactions', transactionId);
    const cleanData = { ...transactionData };
    if (cleanData.value !== undefined) {
      cleanData.value = Number(cleanData.value);
    }
    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'transactions', transactionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    throw error;
  }
};

// --- SERVIÇO DE RELATÓRIOS DA IA ---
export const getAIReports = async (userId: string): Promise<AIReport[]> => {
  try {
    // Ordenação feita no cliente para evitar necessidade de índice composto
    const q = query(
      collection(db, 'aiReports'), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const reports: AIReport[] = [];
    querySnapshot.forEach((docSnap) => {
      reports.push({ id: docSnap.id, ...docSnap.data() } as AIReport);
    });
    // Ordenar por data de criação (mais recente primeiro) no cliente
    reports.sort((a, b) => {
      const dateA = a.createdAt || '';
      const dateB = b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
    return reports;
  } catch (error) {
    console.error("Erro ao obter relatórios de IA:", error);
    throw error;
  }
};

export const addAIReport = async (userId: string, prompt: string, response: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'aiReports'), {
      userId,
      prompt,
      response,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao salvar relatório de IA:", error);
    throw error;
  }
};
