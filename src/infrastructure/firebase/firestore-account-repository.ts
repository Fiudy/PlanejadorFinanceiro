import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import type { AccountProps } from "@/domain/entities/account";
import { Account } from "@/domain/entities/account";
import type { AccountRepository } from "@/domain/repositories/repositories";
import { getFirestoreDb } from "./firebase-config";

/**
 * Coleção plana no nível raiz ("accounts"), com o campo userId em cada
 * documento — em vez de subcoleção users/{uid}/accounts. Isso mantém o
 * contrato do domínio (findById/delete recebem só o id) idêntico ao da
 * implementação local. O isolamento por usuário é garantido pelas
 * firestore.rules (veja o arquivo na raiz do projeto).
 */
type AccountDoc = Omit<AccountProps, "id" | "createdAt"> & { createdAt: string };

const COLLECTION = "accounts";

function toDomain(id: string, data: AccountDoc): Account {
  return Account.fromProps({ ...data, id, createdAt: new Date(data.createdAt) });
}

export class FirestoreAccountRepository implements AccountRepository {
  async findAllByUser(userId: string): Promise<Account[]> {
    const q = query(collection(getFirestoreDb(), COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toDomain(d.id, d.data() as AccountDoc));
  }

  async findById(id: string): Promise<Account | null> {
    const snapshot = await getDoc(doc(getFirestoreDb(), COLLECTION, id));
    return snapshot.exists() ? toDomain(snapshot.id, snapshot.data() as AccountDoc) : null;
  }

  async save(account: Account): Promise<void> {
    const { id, createdAt, ...rest } = account.toProps();
    await setDoc(doc(getFirestoreDb(), COLLECTION, id), { ...rest, createdAt: createdAt.toISOString() });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirestoreDb(), COLLECTION, id));
  }
}
