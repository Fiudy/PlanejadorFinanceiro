import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import type {
  AuthCredentials,
  AuthenticatedIdentity,
  AuthService,
} from "@/domain/repositories/repositories";
import { getFirebaseAuth } from "./firebase-config";

export class FirebaseAuthService implements AuthService {
  private identity(user: { uid: string; displayName: string | null; email: string | null }): AuthenticatedIdentity {
    if (!user.email) throw new Error("A conta autenticada não possui um e-mail disponível.");
    return { id: user.uid, name: user.displayName ?? "", email: user.email };
  }

  getCurrentUser(): AuthenticatedIdentity | null {
    const user = getFirebaseAuth().currentUser;
    if (!user || !user.email) return null;
    return { id: user.uid, name: user.displayName ?? "", email: user.email };
  }

  onAuthStateChanged(callback: (identity: AuthenticatedIdentity | null) => void): () => void {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!user || !user.email) {
        callback(null);
        return;
      }
      callback({ id: user.uid, name: user.displayName ?? "", email: user.email });
    });
  }

  async signUp(name: string, credentials: AuthCredentials): Promise<AuthenticatedIdentity> {
    const auth = getFirebaseAuth();
    const result = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    await updateProfile(result.user, { displayName: name });
    return { id: result.user.uid, name, email: credentials.email };
  }

  async signIn(credentials: AuthCredentials): Promise<AuthenticatedIdentity> {
    try {
      const result = await signInWithEmailAndPassword(getFirebaseAuth(), credentials.email, credentials.password);
      return this.identity(result.user);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code)) {
        throw new Error("E-mail ou senha inválidos. Se sua conta veio do Organiza Contas, redefina a senha ou entre com o Google.", { cause: error });
      }
      if (code === "auth/too-many-requests") {
        throw new Error("Muitas tentativas de acesso. Aguarde alguns minutos ou redefina sua senha.", { cause: error });
      }
      throw error;
    }
  }

  async signInWithGoogle(): Promise<AuthenticatedIdentity> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(getFirebaseAuth(), provider);
      return this.identity(result.user);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "auth/popup-closed-by-user") throw new Error("A entrada com Google foi cancelada.", { cause: error });
      if (code === "auth/popup-blocked") throw new Error("O navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.", { cause: error });
      if (code === "auth/account-exists-with-different-credential") {
        throw new Error("Este e-mail já usa outra forma de acesso. Entre por e-mail e senha ou redefina a senha.", { cause: error });
      }
      if (code === "auth/unauthorized-domain") {
        throw new Error("Este endereço não está autorizado para login com Google. Avise o suporte (domínio não configurado no Firebase Authentication).", { cause: error });
      }
      if (code === "auth/operation-not-allowed") {
        throw new Error("O login com Google não está habilitado neste momento. Avise o suporte.", { cause: error });
      }
      if (code === "auth/network-request-failed") {
        throw new Error("Falha de conexão ao entrar com Google. Verifique sua internet e tente novamente.", { cause: error });
      }
      throw new Error("Não foi possível entrar com Google agora. Tente novamente ou use e-mail e senha.", { cause: error });
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  }

  async signOut(): Promise<void> {
    await signOut(getFirebaseAuth());
  }
}
