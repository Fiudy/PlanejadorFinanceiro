import type { ReactNode} from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="oc-app oc-modal-backdrop">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "oc-modal z-10",
          className,
        )}
      >
        <button className="oc-modal-close" onClick={onClose} aria-label="Fechar">×</button>
        <span className="oc-eyebrow">{title.toLocaleUpperCase("pt-BR")}</span>
        <h2>{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
