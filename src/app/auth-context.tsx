import type { ReactNode} from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { AuthenticatedIdentity } from "@/domain/repositories/repositories";
import { container } from "@/infrastructure/di/container";
import type { CategoryUseCases } from "@/application/use-cases/category-use-cases";

interface AuthContextValue {
  user: AuthenticatedIdentity | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  // onAuthStateChanged pode disparar mais de uma vez para o mesmo usuário
  // (ex: restauração de sessão em cache seguida da confirmação de rede) —
  // sem essa guarda, seedDefaults roda em paralelo mais de uma vez.
  const seededUserRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = container.authService.onAuthStateChanged((identity) => {
      setUser(identity);
      setLoading(false);
      if (identity && seededUserRef.current !== identity.id) {
        seededUserRef.current = identity.id;
        // Garante categorias padrão e lança contas fixas vencidas ao entrar.
        void (container.categories as CategoryUseCases).seedDefaults(identity.id);
        void container.recurringBills.runDueBills(identity.id);
      }
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: async (email, password) => {
      await container.authService.signIn({ email, password });
    },
    signInWithGoogle: async () => {
      await container.authService.signInWithGoogle();
    },
    sendPasswordReset: async (email) => {
      await container.authService.sendPasswordReset(email);
    },
    signUp: async (name, email, password) => {
      await container.authService.signUp(name, { email, password });
    },
    signOut: async () => {
      await container.authService.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  return context;
}
