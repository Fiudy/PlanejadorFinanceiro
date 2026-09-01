import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";
import type { Card, CardBrand } from "@/domain/entities/card";

export function useCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cards", user?.id],
    queryFn: () => container.cards.list(user!.id),
    enabled: Boolean(user),
  });
}

export function useCreateCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      holderName?: string;
      logoUrl?: string;
      bank: string;
      color: string;
      brand: CardBrand;
      limitCents: number;
      closingDay: number;
      dueDay: number;
    }) => container.cards.create({ userId: user!.id, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cards", user?.id] });
    },
  });
}

export function useUpdateCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, ...input }: { cardId: string; name: string; holderName?: string; logoUrl?: string; bank: string; color: string; brand: CardBrand; limitCents: number; closingDay: number; dueDay: number }) => container.cards.update(cardId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cards", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["card-available-limit"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", user?.id] });
    },
  });
}

export function useCardAvailableLimit(card: Card | undefined) {
  const { data: cards } = useCards();
  return useQuery({
    queryKey: ["card-available-limit", card?.id, cards?.length],
    queryFn: () => container.cards.availableLimit(card!),
    enabled: Boolean(card),
  });
}

export function useCardInvoice(card: Card | undefined, referenceDate: Date) {
  return useQuery({
    queryKey: ["card-invoice", card?.id, referenceDate.getFullYear(), referenceDate.getMonth()],
    queryFn: () => container.cards.invoiceForMonth(card!, referenceDate),
    enabled: Boolean(card),
  });
}

/** Parcelas de todos os cartões ativos que caem no mês de referência — usado na visão mensal de transações. */
export function useAllCardInstallmentsForMonth(referenceDate: Date) {
  const { user } = useAuth();
  const { data: cards = [] } = useCards();
  const activeCards = cards.filter((c) => !c.archived);
  const cardIds = activeCards.map((c) => c.id).join(",");

  return useQuery({
    queryKey: ["card-installments-month", user?.id, cardIds, referenceDate.getFullYear(), referenceDate.getMonth()],
    queryFn: async () => {
      const perCard = await Promise.all(activeCards.map((card) => container.cards.invoiceForMonth(card, referenceDate)));
      return perCard.flatMap((items, index) =>
        items.map((item) => ({ ...item, cardName: activeCards[index].name, cardColor: activeCards[index].color })),
      );
    },
    enabled: Boolean(user) && activeCards.length > 0,
  });
}

export function useAddCardPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      cardId: string;
      categoryId: string;
      description: string;
      totalAmountCents: number;
      installmentsCount: number;
      firstInstallmentDate: Date;
    }) => container.cards.addPurchase({ userId: user!.id, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["card-invoice"] });
      void queryClient.invalidateQueries({ queryKey: ["card-available-limit"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", user?.id] });
    },
  });
}
