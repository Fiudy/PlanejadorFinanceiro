import { Dialog } from "./dialog";
import { Button } from "./button";

/** Confirmação genérica para ações destrutivas (excluir, arquivar, desativar). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  isLoading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted-500">{description}</p>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1 justify-center" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" className="flex-1 justify-center" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? "Aguarde..." : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
