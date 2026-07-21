import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/shared/ui/dialog";
import { Field, Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { useCreateCategory } from "../hooks/use-categories";
import { pickRandomColor } from "@/shared/lib/random";
import type { Category, CategoryKind } from "@/domain/entities/category";

const schema = z.object({
  name: z.string().min(1, "Informe o nome da categoria."),
  kind: z.enum(["receita", "despesa"]),
});

type FormData = z.infer<typeof schema>;

const CATEGORY_COLORS = ["#0F7B5C", "#4B7BEC", "#9B6BD1", "#E08E45", "#D33A6E", "#64748B"];

export function CategoryFormDialog({
  open,
  onClose,
  defaultKind,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  /** Quando informado, o campo "Tipo" fica oculto e travado nesse valor — usado quando o diálogo é aberto a partir de um select de categoria que já sabe o tipo esperado. */
  defaultKind?: CategoryKind;
  /** Chamado com a categoria recém-criada, além do onClose padrão. */
  onCreated?: (category: Category) => void;
}) {
  const createCategory = useCreateCategory();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { kind: defaultKind ?? "despesa" } });

  const onSubmit = async (data: FormData) => {
    const category = await createCategory.mutateAsync({
      name: data.name,
      kind: defaultKind ?? data.kind,
      color: pickRandomColor(CATEGORY_COLORS),
      icon: "more-horizontal",
    });
    onCreated?.(category);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Nova categoria">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="name">
          <Input id="name" placeholder="Ex: Pets" error={errors.name?.message} autoFocus {...register("name")} />
        </Field>

        {!defaultKind && (
          <Field label="Tipo" htmlFor="kind">
            <Select id="kind" {...register("kind")}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </Select>
          </Field>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? "Salvando..." : "Salvar categoria"}
        </Button>
      </form>
    </Dialog>
  );
}
