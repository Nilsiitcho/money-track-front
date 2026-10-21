import { api } from "./client";
import type {
  Category,
  Dashboard,
  EditScope,
  EntryCreatePayload,
  EntryRule,
  EntryUpdatePayload,
  Grid,
  LoginResponse,
  Occurrence,
} from "./types";

// ---- Auth ----
export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/auth/login", { username, password });
  return data;
}

// ---- Categorias ----
export async function listCategories(includeArchived = false): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/api/categories", {
    params: { includeArchived },
  });
  return data;
}

export async function createCategory(name: string): Promise<Category> {
  const { data } = await api.post<Category>("/api/categories", { name });
  return data;
}

export async function renameCategory(id: number, name: string): Promise<Category> {
  const { data } = await api.put<Category>(`/api/categories/${id}`, { name });
  return data;
}

export async function archiveCategory(id: number): Promise<Category> {
  const { data } = await api.post<Category>(`/api/categories/${id}/archive`);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/api/categories/${id}`);
}

// ---- Lancamentos ----
export interface EntryFilters {
  month: string;
  type?: string;
  categoryId?: number;
  recurrence?: string;
  q?: string;
}

export async function listEntries(filters: EntryFilters): Promise<Occurrence[]> {
  const { data } = await api.get<Occurrence[]>("/api/entries", { params: filters });
  return data;
}

export async function getEntry(id: number): Promise<EntryRule> {
  const { data } = await api.get<EntryRule>(`/api/entries/${id}`);
  return data;
}

export async function createEntry(payload: EntryCreatePayload): Promise<EntryRule> {
  const { data } = await api.post<EntryRule>("/api/entries", payload);
  return data;
}

export async function updateEntry(id: number, payload: EntryUpdatePayload): Promise<EntryRule> {
  const { data } = await api.put<EntryRule>(`/api/entries/${id}`, payload);
  return data;
}

export async function deleteEntry(
  id: number,
  scope?: EditScope,
  referenceMonth?: string,
): Promise<void> {
  await api.delete(`/api/entries/${id}`, { params: { scope, referenceMonth } });
}

// ---- Dashboard ----
export async function getDashboard(month: string): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>("/api/dashboard", { params: { month } });
  return data;
}

// ---- Relatorio (tabela pivo) ----
export async function getGrid(from: string, months = 12, exclude: number[] = []): Promise<Grid> {
  const params: Record<string, string | number> = { from, months };
  if (exclude.length > 0) params.exclude = exclude.join(",");
  const { data } = await api.get<Grid>("/api/report/grid", { params });
  return data;
}
