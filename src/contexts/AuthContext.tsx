import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  deleteUser, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, acceptedTerms: boolean) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePrivacyConsent: (accepted: boolean) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Firestore profile when user state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, acceptedTerms: boolean) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const profileData: UserProfile = {
        uid: newUser.uid,
        name,
        email,
        createdAt: new Date().toISOString(),
        acceptedTerms
      };

      // Guardar perfil no Firestore
      await setDoc(doc(db, 'users', newUser.uid), profileData);
      setUserProfile(profileData);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updatePrivacyConsent = async (accepted: boolean) => {
    if (!user) throw new Error("Usuário não autenticado");
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { acceptedTerms: accepted }, { merge: true });
    
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        acceptedTerms: accepted
      });
    }
  };

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Nenhum usuário logado");

    setLoading(true);
    try {
      const uid = currentUser.uid;
      const batch = writeBatch(db);

      // 1. Deletar transações
      const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
      const transactionsSnap = await getDocs(transactionsQuery);
      transactionsSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 2. Deletar propriedades
      const propertiesQuery = query(collection(db, 'properties'), where('userId', '==', uid));
      const propertiesSnap = await getDocs(propertiesQuery);
      propertiesSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. Deletar relatórios da IA
      const reportsQuery = query(collection(db, 'aiReports'), where('userId', '==', uid));
      const reportsSnap = await getDocs(reportsQuery);
      reportsSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 4. Deletar documento do usuário
      batch.delete(doc(db, 'users', uid));

      // Commit do lote do firestore
      await batch.commit();

      // 5. Deletar o usuário do Firebase Authentication
      await deleteUser(currentUser);
      
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Erro na exclusão completa de conta (LGPD):", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      login,
      register,
      logout,
      resetPassword,
      updatePrivacyConsent,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
