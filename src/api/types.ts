export type EntryType = "RECEITA" | "DESPESA";
export type Recurrence = "UNICO" | "FIXO" | "PARCELADO";
export type EditScope = "ONLY_THIS" | "THIS_AND_FUTURE" | "ALL";

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  username: string;
}

export interface Category {
  id: number;
  name: string;
  archived: boolean;
}

export interface Occurrence {
  entryId: number;
  type: EntryType;
  description: string;
  amount: number;
  categoryId: number;
  categoryName: string;
  month: string; // YYYY-MM
  recurrence: Recurrence;
  installmentLabel: string | null;
  scoped: boolean;
}

export interface EntryRule {
  id: number;
  type: EntryType;
  description: string;
  amount: number;
  categoryId: number;
  categoryName: string;
  recurrence: Recurrence;
  startMonth: string;
  endMonth: string | null;
  installmentFirst: number | null;
  installmentTotal: number | null;
}

export interface EntryCreatePayload {
  type: EntryType;
  description: string;
  amount: number;
  categoryId: number;
  recurrence: Recurrence;
  startMonth: string;
  endMonth?: string | null;
  installments?: number | null;
}

export interface EntryUpdatePayload {
  type: EntryType;
  description: string;
  amount: number;
  categoryId: number;
  scope?: EditScope;
  referenceMonth?: string | null;
}

export interface Dashboard {
  month: string;
  totals: { receitas: number; despesas: number; saldo: number };
  accumulated: number;
  series: { month: string; saldo: number; accumulated: number }[];
  byCategory: { categoryId: number; name: string; total: number }[];
}

export interface GridEntryRow {
  entryId: number;
  label: string;
  values: number[];
}

export interface GridCategoryRow {
  categoryId: number;
  name: string;
  values: number[];
  entries: GridEntryRow[];
}

export interface Grid {
  months: string[];
  receitas: GridCategoryRow[];
  despesas: GridCategoryRow[];
  totalReceitas: number[];
  totalDespesas: number[];
  saldo: number[];
  accumulated: number[];
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  status: number;
  message: string;
  fieldErrors?: ApiFieldError[];
}
