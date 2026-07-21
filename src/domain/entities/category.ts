export type CategoryKind = "receita" | "despesa";

export interface CategoryProps {
  id: string;
  userId: string;
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  isDefault: boolean;
}

export class Category {
  private constructor(private readonly props: CategoryProps) {}

  static create(props: Omit<CategoryProps, "isDefault"> & { isDefault?: boolean }): Category {
    if (!props.name.trim()) {
      throw new Error("O nome da categoria é obrigatório.");
    }
    return new Category({ ...props, isDefault: props.isDefault ?? false });
  }

  static fromProps(props: CategoryProps): Category {
    return new Category(props);
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get name() {
    return this.props.name;
  }
  get kind() {
    return this.props.kind;
  }
  get color() {
    return this.props.color;
  }
  get icon() {
    return this.props.icon;
  }
  get isDefault() {
    return this.props.isDefault;
  }

  rename(name: string): Category {
    if (!name.trim()) throw new Error("O nome da categoria é obrigatório.");
    return new Category({ ...this.props, name });
  }

  toProps(): CategoryProps {
    return { ...this.props };
  }
}

export const DEFAULT_CATEGORIES: Array<Pick<CategoryProps, "name" | "kind" | "color" | "icon">> = [
  { name: "Salário", kind: "receita", color: "#0F7B5C", icon: "wallet" },
  { name: "Freelancer", kind: "receita", color: "#26A37C", icon: "briefcase" },
  { name: "Outras receitas", kind: "receita", color: "#4FB58A", icon: "plus-circle" },
  { name: "Moradia", kind: "despesa", color: "#E5484D", icon: "home" },
  { name: "Alimentação", kind: "despesa", color: "#E08E45", icon: "utensils" },
  { name: "Transporte", kind: "despesa", color: "#4B7BEC", icon: "car" },
  { name: "Saúde", kind: "despesa", color: "#D33A6E", icon: "heart-pulse" },
  { name: "Lazer", kind: "despesa", color: "#9B6BD1", icon: "party-popper" },
  { name: "Assinaturas", kind: "despesa", color: "#5C6AC4", icon: "repeat" },
  { name: "Outros", kind: "despesa", color: "#64748B", icon: "more-horizontal" },
];
