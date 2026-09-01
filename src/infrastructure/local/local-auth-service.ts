import { randomId } from "@/shared/lib/id";
import type {
  AuthCredentials,
  AuthenticatedIdentity,
  AuthService,
} from "@/domain/repositories/repositories";
import { localStorageClient } from "./local-storage-client";

/**
 * Implementação de desenvolvimento do AuthService, sem backend.
 * A senha é guardada apenas localmente (hash simples via SubtleCrypto),
 * exclusivamente para permitir rodar o app sem configurar um projeto
 * Firebase. Nunca use esta implementação em produção — troque pela
 * FirebaseAuthService (ver src/infrastructure/firebase).
 */
interface StoredCredential {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

const CREDENTIALS_COLLECTION = "auth_credentials";
const SESSION_KEY = "planejador-financeiro:session";

async function hash(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Listener = (identity: AuthenticatedIdentity | null) => void;

export class LocalAuthService implements AuthService {
  private listeners = new Set<Listener>();

  getCurrentUser(): AuthenticatedIdentity | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthenticatedIdentity) : null;
  }

  onAuthStateChanged(callback: Listener): () => void {
    this.listeners.add(callback);
    callback(this.getCurrentUser());
    return () => this.listeners.delete(callback);
  }

  private emit(identity: AuthenticatedIdentity | null) {
    for (const listener of this.listeners) listener(identity);
  }

  async signUp(name: string, credentials: AuthCredentials): Promise<AuthenticatedIdentity> {
    const existing = localStorageClient
      .readAll<StoredCredential>(CREDENTIALS_COLLECTION)
      .find((item) => item.email === credentials.email);
    if (existing) throw new Error("Já existe uma conta com este e-mail.");

    const identity: AuthenticatedIdentity = { id: randomId(), name, email: credentials.email };
    const passwordHash = await hash(credentials.password);
    localStorageClient.upsert<StoredCredential>(CREDENTIALS_COLLECTION, { ...identity, passwordHash });

    localStorage.setItem(SESSION_KEY, JSON.stringify(identity));
    this.emit(identity);
    return identity;
  }

  async signIn(credentials: AuthCredentials): Promise<AuthenticatedIdentity> {
    const passwordHash = await hash(credentials.password);
    const stored = localStorageClient
      .readAll<StoredCredential>(CREDENTIALS_COLLECTION)
      .find((item) => item.email === credentials.email && item.passwordHash === passwordHash);

    if (!stored) throw new Error("E-mail ou senha inválidos.");

    const identity: AuthenticatedIdentity = { id: stored.id, name: stored.name, email: stored.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(identity));
    this.emit(identity);
    return identity;
  }

  async signInWithGoogle(): Promise<AuthenticatedIdentity> {
    throw new Error("A entrada com Google requer a configuração do Firebase.");
  }

  async sendPasswordReset(email: string): Promise<void> {
    const exists = localStorageClient
      .readAll<StoredCredential>(CREDENTIALS_COLLECTION)
      .some((item) => item.email === email);
    if (!exists) throw new Error("Não encontramos uma conta local com esse e-mail.");
    throw new Error("A recuperação de senha requer a configuração do Firebase.");
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    this.emit(null);
  }
}
