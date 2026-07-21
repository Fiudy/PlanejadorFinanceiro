import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    return {
      id: result.user.uid,
      name: result.user.displayName ?? "",
      email: credentials.email,
    };
  }

  async signOut(): Promise<void> {
    await signOut(getFirebaseAuth());
  }
}
