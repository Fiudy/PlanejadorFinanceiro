import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, CreditCard as CreditCardIcon, Pencil } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { useCards, useCardAvailableLimit } from "../hooks/use-cards";
import { CardTile } from "./card-tile";
import { CardFormDialog } from "./card-form-dialog";
import { PurchaseFormDialog } from "./purchase-form-dialog";
import { CardInvoice } from "./card-invoice";
import { PageSpinner } from "@/shared/ui/spinner";
import { Draggable, gsap, prefersReducedMotion } from "@/shared/lib/gsap";

/**
 * Carrossel horizontal "estilo app bancário": arrasta com inércia e
 * assenta suavemente no cartão mais próximo, mas continua respondendo a
 * wheel/trackpad no desktop. `dragClickables: true` é o que deixa o
 * Draggable diferenciar tap de arrasto sozinho — o onClick de cada
 * CardTile continua funcionando sem detecção de gesto feita na mão.
 */
function useCardCarousel(cardCount: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || cardCount === 0) return;

    const getStep = () => {
      const first = track.children[0] as HTMLElement | undefined;
      const second = track.children[1] as HTMLElement | undefined;
      if (!first || !second) return 0;
      return second.offsetLeft - first.offsetLeft;
    };

    const getBounds = () => ({
      minX: -Math.max(0, track.scrollWidth - viewport.clientWidth),
      maxX: 0,
    });

    if (prefersReducedMotion()) {
      viewport.classList.add("overflow-x-auto", "scrollbar-hidden");
      return;
    }

    const [instance] = Draggable.create(track, {
      type: "x",
      bounds: getBounds(),
      edgeResistance: 0.7,
      inertia: true,
      dragClickables: true,
      snap: {
        x: (value: number) => {
          const step = getStep();
          return step ? Math.round(value / step) * step : value;
        },
      },
    });

    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      event.preventDefault();
      const bounds = getBounds();
      const nextX = gsap.utils.clamp(bounds.minX, bounds.maxX, instance.x - delta);
      gsap.to(track, {
        x: nextX,
        duration: 0.3,
        ease: "power2.out",
        onUpdate: () => instance.update(),
      });
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => instance.applyBounds(getBounds());
    window.addEventListener("resize", onResize);

    return () => {
      viewport.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      instance.kill();
    };
  }, [cardCount]);

  return { viewportRef, trackRef };
}

export function CardsPage() {
  const { data: cards, isLoading } = useCards();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCards = (cards ?? []).filter((c) => !c.archived);
  const selectedCard = activeCards.find((c) => c.id === selectedId) ?? activeCards[0];
  const { data: availableLimit } = useCardAvailableLimit(selectedCard);
  const { viewportRef, trackRef } = useCardCarousel(activeCards.length);

  // Atalho do PWA ("Nova compra no cartão" no ícone do app) chega como ?novo=compra.
  useEffect(() => {
    if (searchParams.get("novo") === "compra" && selectedCard) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o deep link do atalho de PWA, não é estado derivável em render
      setPurchaseDialogOpen(true);
      setSearchParams(
        (params) => {
          params.delete("novo");
          return params;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selectedCard]);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950 dark:text-paper-50">Cartões</h1>
          <p className="text-sm text-muted-500">Limite, fatura e compras parceladas.</p>
        </div>
        <div className="flex gap-2">
          {selectedCard && <Button variant="secondary" onClick={() => { setEditing(true); setCardDialogOpen(true); }}><Pencil className="h-4 w-4" />Editar</Button>}
          <Button onClick={() => { setEditing(false); setCardDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          Cartão
          </Button>
        </div>
      </div>

      {activeCards.length === 0 ? (
        <EmptyState
          icon={CreditCardIcon}
          title="Nenhum cartão cadastrado"
          description="Adicione seus cartões de crédito para acompanhar limite e fatura."
          action={<Button onClick={() => setCardDialogOpen(true)}>Adicionar cartão</Button>}
        />
      ) : (
        <>
          <div ref={viewportRef} className="-mx-1 touch-pan-y overflow-hidden px-1 pb-1">
            <div ref={trackRef} className="flex w-max gap-3">
              {activeCards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  availableLimit={card.id === selectedCard?.id ? availableLimit : undefined}
                  selected={card.id === selectedCard?.id}
                  onClick={() => setSelectedId(card.id)}
                />
              ))}
            </div>
          </div>

          {selectedCard && (
            <CardInvoice card={selectedCard} cards={activeCards} onAddPurchase={() => setPurchaseDialogOpen(true)} />
          )}
        </>
      )}

      <CardFormDialog open={cardDialogOpen} onClose={() => setCardDialogOpen(false)} card={editing ? selectedCard : undefined} />
      {selectedCard && (
        <PurchaseFormDialog
          open={purchaseDialogOpen}
          onClose={() => setPurchaseDialogOpen(false)}
          cards={activeCards}
          defaultCardId={selectedCard.id}
        />
      )}
    </div>
  );
}
