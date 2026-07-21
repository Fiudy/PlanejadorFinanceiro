# Planejador Financeiro

Aplicação web de controle financeiro pessoal — contas, cartões de crédito
com parcelamento, contas fixas recorrentes, metas e um dashboard completo.
Mobile-first, responsiva e instalável como app (PWA).

## Stack

- **Frontend:** React 19 + TypeScript (modo estrito) + Vite
- **Estilo:** Tailwind CSS v4 + design system próprio (`src/shared/ui`)
- **Estado de servidor:** TanStack Query
- **Estado de UI:** Zustand (tema)
- **Formulários:** react-hook-form + zod
- **Gráficos:** Recharts
- **Backend:** Firebase (Firestore + Authentication) — **opcional**. Sem
  configurar nada, o app roda 100% no navegador com dados em `localStorage`.

## Arquitetura

O projeto segue Clean Code / DDD em camadas, independente de o backend ser
Firebase ou local:

```
src/
├── domain/            entidades, value objects e interfaces de repositório
│                      — puro TypeScript, zero dependência de Firebase/React
├── application/       use cases — orquestram o domínio através das
│                      interfaces de repositório
├── infrastructure/
│   ├── local/         implementação em localStorage (padrão, sem configuração)
│   ├── firebase/      implementação em Firestore/Firebase Auth
│   └── di/            container — único ponto que decide local vs Firebase
├── features/          camada de apresentação, uma pasta por funcionalidade
│   └── */components, */hooks
├── shared/            design system (ui), layout, tema, utilitários
└── app/               roteamento, providers, contexto de autenticação
```

Nenhuma feature importa um repositório concreto diretamente — sempre através
de `src/infrastructure/di/container.ts`. Trocar de local para Firebase (ou
para qualquer outro backend, no futuro) não exige tocar em nenhuma tela nem
em nenhuma regra de negócio.

## Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Sem nenhuma configuração adicional, crie uma
conta (fica salva no `localStorage` do navegador) e use o app normalmente.

> O modo local usa uma implementação própria de autenticação, apenas para
> desenvolvimento sem backend. Não é adequada para produção — para isso,
> configure o Firebase (próxima seção).

## Ativando o Firebase (opcional)

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. Ative **Authentication** (método E-mail/senha) e **Cloud Firestore**.
3. Em "Configurações do projeto" → "Seus apps", crie um app Web e copie as
   credenciais.
4. Copie `.env.example` para `.env` e preencha:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

5. Publique as regras de segurança (na raiz do projeto):

   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```

   (ou cole o conteúdo de `firestore.rules` direto no console do Firebase).

6. **Índice composto:** a consulta de compras de cartão filtra por `cardId`
   e `userId` ao mesmo tempo. Na primeira vez que isso rodar contra o
   Firestore, o console vai sugerir criar o índice composto necessário —
   basta clicar no link do erro para criá-lo automaticamamente.

Com as variáveis definidas, `npm run dev` já usa o Firebase automaticamente
— não é necessário nenhum outro ajuste no código. A tela de Configurações
mostra um indicador de qual modo está ativo ("Local" ou "Firebase").

## Scripts

```bash
npm run dev       # ambiente de desenvolvimento
npm run build     # build de produção (tsc --build + vite build)
npm run preview   # serve o build de produção localmente
npm run lint      # ESLint (regras estritas contra código morto/duplicado)
```

## Modelo de dados (Firestore)

Coleções planas no nível raiz, cada documento com um campo `userId` —
o isolamento entre usuários é garantido por `firestore.rules`, não pela
estrutura de pastas:

```
accounts/{accountId}
categories/{categoryId}
transactions/{transactionId}
cards/{cardId}
cardPurchases/{purchaseId}
recurringBills/{billId}
goals/{goalId}
```

## Escopo desta versão (onda 1)

Autenticação · contas · categorias · transações · cartões com fatura e
parcelamento · contas fixas recorrentes (lançamento automático ao abrir o
app) · metas financeiras · dashboard (saldo, receita x despesa, gráfico por
categoria, evolução mensal, próximos vencimentos) · dark/light mode.

Fora desta versão (backlog): módulo de veículo, "receber de pessoas" com
abatimento automático, notificações push, exportação (Excel/PDF/JSON),
dashboard com previsões/alertas avançados.
