import { useState } from "react";
import { Select } from "@/shared/ui/select";
import type { Category, CategoryKind } from "@/domain/entities/category";
import { CategoryFormDialog } from "./category-form-dialog";

const CREATE_VALUE = "__create_category__";

/**
 * Select de categoria com atalho embutido para criar uma categoria nova
 * sem sair do formulário atual — usado em todo formulário que pede uma
 * categoria (transação, compra no cartão, conta fixa).
 */
export function CategorySelect({
  id,
  name,
  categories,
  kind,
  value,
  onChange,
  onBlur,
}: {
  id?: string;
  name?: string;
  categories: Category[];
  kind: CategoryKind;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Select
        id={id}
        name={name}
        value={value}
        onBlur={onBlur}
        onChange={(event) => {
          if (event.target.value === CREATE_VALUE) {
            setDialogOpen(true);
            return;
          }
          onChange(event.target.value);
        }}
      >
        <option value="">Selecione</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
        <option value={CREATE_VALUE}>+ Nova categoria…</option>
      </Select>

      <CategoryFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        defaultKind={kind}
        onCreated={(category) => onChange(category.id)}
      />
    </>
  );
}
