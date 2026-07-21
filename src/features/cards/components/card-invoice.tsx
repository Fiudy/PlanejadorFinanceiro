import { useState } from "react";
import { FileUp, Plus, Receipt } from "lucide-react";
import type { Card as CardEntity } from "@/domain/entities/card";
import { Money } from "@/domain/value-objects/money";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { formatDate } from "@/shared/lib/date";
import { useCardInvoice } from "../hooks/use-cards";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { isGeminiConfigured } from "@/shared/lib/gemini";
import { ImportInvoiceDialog } from "./import-invoice-dialog";

export function CardInvoice({
  card,
  cards,
  onAddPurchase,
}: {
  card: CardEntity;
  /** Cartões ativos disponíveis — usado para deixar o usuário escolher a qual a fatura importada pertence. */
  cards: CardEntity[];
  onAddPurchase: () => void;
}) {
  const referenceDate = new Date();
  const { data: items = [] } = useCardInvoice(card, referenceDate);
  const { data: categories = [] } = useCategories();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const [importOpen, setImportOpen] = useState(false);

  const total = items.reduce((sum, item) => sum.add(item.amount), Money.zero());

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Fatura do mês</CardTitle>
          {items.length > 0 && <p className="mt-1 text-xl font-display font-semibold">{total.format()}</p>}
        </div>
        <div className="flex gap-2">
          {isGeminiConfigured && (
            <Button size="sm" variant="secondary" onClick={() => setImportOpen(true)}>
              <FileUp className="h-3.5 w-3.5" />
              Importar PDF
            </Button>
          )}
          <Button size="sm" onClick={onAddPurchase}>
            <Plus className="h-3.5 w-3.5" />
            Compra
          </Button>
        </div>
      </CardHeader>

      {items.length === 0 ? (
        <EmptyState icon={Receipt} title="Fatura vazia" description="As compras deste cartão no mês atual aparecerão aqui." />
      ) : (
        <ul className="flex flex-col divide-y divide-border-light dark:divide-border-dark">
          {items.map((item) => {
            const category = categoryById.get(item.purchase.categoryId);
            return (
              <li key={`${item.purchase.id}-${item.installmentNumber}`} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink-950 dark:text-paper-50">{item.purchase.description}</p>
                  <p className="text-xs text-muted-500">
                    {category?.name ?? "Sem categoria"} · {formatDate(item.installmentDate)}
                    {item.installmentsCount > 1 && ` · ${item.installmentNumber}/${item.installmentsCount}`}
                  </p>
                </div>
                <span className="tabular text-sm font-semibold">{item.amount.format()}</span>
              </li>
            );
          })}
        </ul>
      )}

      {isGeminiConfigured && (
        <ImportInvoiceDialog open={importOpen} onClose={() => setImportOpen(false)} cards={cards} defaultCardId={card.id} />
      )}
    </Card>
  );
}
