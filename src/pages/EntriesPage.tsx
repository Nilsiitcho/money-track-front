import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Stack, TextField, MenuItem, Typography, IconButton,
  List, ListItem, ListItemText, Chip, CircularProgress, Alert, Divider, Button,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { MonthSelector } from "../components/MonthSelector";
import { EntryFormDialog } from "../components/EntryFormDialog";
import { ScopeDialog } from "../components/ScopeDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { listCategories, listEntries, deleteEntry } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { currentMonth, formatMoney } from "../lib/format";
import { DESPESA_COLOR, RECEITA_COLOR } from "../theme";
import type { EditScope, Occurrence } from "../api/types";

const RECURRENCE_LABEL: Record<string, string> = {
  UNICO: "Unico",
  FIXO: "Fixo",
  PARCELADO: "Parcelado",
};

type SortBy = "inserted" | "amount" | "description" | "category" | "type";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "inserted", label: "Insercao" },
  { value: "amount", label: "Valor" },
  { value: "description", label: "Descricao" },
  { value: "category", label: "Categoria" },
  { value: "type", label: "Tipo" },
];

export function EntriesPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonth());
  const [type, setType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [q, setQ] = useState("");
  // Padrao: ordem de insercao, mais recente primeiro (entryId desc).
  const [sortBy, setSortBy] = useState<SortBy>("inserted");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<{ entryId: number; occurrenceMonth: string } | null>(null);
  const [deleteScopeFor, setDeleteScopeFor] = useState<Occurrence | null>(null);
  const [confirmFor, setConfirmFor] = useState<Occurrence | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const categoriesQuery = useQuery({ queryKey: ["categories", false], queryFn: () => listCategories(false) });

  const filters = {
    month,
    type: type || undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    recurrence: recurrence || undefined,
    q: q || undefined,
  };
  const { data, isLoading, error } = useQuery({
    queryKey: ["entries", filters],
    queryFn: () => listEntries(filters),
  });

  const sorted = useMemo(() => {
    const arr = [...(data ?? [])];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let base: number;
      switch (sortBy) {
        case "amount":
          base = a.amount - b.amount;
          break;
        case "description":
          base = a.description.localeCompare(b.description, "pt", { sensitivity: "base" });
          break;
        case "category":
          base = (a.categoryName ?? "").localeCompare(b.categoryName ?? "", "pt", { sensitivity: "base" });
          break;
        case "type":
          base = a.type.localeCompare(b.type);
          break;
        case "inserted":
        default:
          base = a.entryId - b.entryId;
          break;
      }
      // Desempate estavel por insercao.
      if (base === 0) base = a.entryId - b.entryId;
      return base * dir;
    });
    return arr;
  }, [data, sortBy, sortDir]);

  async function runDelete(occ: Occurrence, scope?: EditScope) {
    setActionError(null);
    try {
      await deleteEntry(occ.entryId, scope, scope ? occ.month : undefined);
      await queryClient.invalidateQueries();
    } catch (err) {
      setActionError(errorMessage(err, "Nao foi possivel excluir"));
    }
  }

  function askDelete(occ: Occurrence) {
    if (occ.scoped) {
      setDeleteScopeFor(occ);
    } else {
      setConfirmFor(occ);
    }
  }

  return (
    <Box>
      <MonthSelector month={month} onChange={setMonth} />

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
          Novo lancamento
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                label="Ordenar por"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                size="small"
                sx={{ flexGrow: 1 }}
              >
                {SORT_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
              <Tooltip title={sortDir === "asc" ? "Crescente" : "Decrescente"}>
                <IconButton
                  aria-label="Inverter ordem"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                >
                  {sortDir === "asc" ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField select label="Tipo" value={type} onChange={(e) => setType(e.target.value)} size="small">
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="RECEITA">Receita</MenuItem>
                <MenuItem value="DESPESA">Despesa</MenuItem>
              </TextField>
              <TextField
                select
                label="Recorrencia"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                size="small"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="UNICO">Unico</MenuItem>
                <MenuItem value="FIXO">Fixo</MenuItem>
                <MenuItem value="PARCELADO">Parcelado</MenuItem>
              </TextField>
            </Stack>
            <TextField
              select
              label="Categoria"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              size="small"
            >
              <MenuItem value="">Todas</MenuItem>
              {(categoriesQuery.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Buscar descricao"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              size="small"
            />
          </Stack>
        </CardContent>
      </Card>

      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage(error)}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          {sorted.length > 0 ? (
            <List disablePadding>
              {sorted.map((occ, i) => (
                <Box key={`${occ.entryId}-${occ.month}`}>
                  {i > 0 && <Divider component="li" />}
                  <ListItem
                    secondaryAction={
                      <Stack direction="row">
                        <IconButton
                          edge="end"
                          aria-label="Editar"
                          onClick={() => setEditing({ entryId: occ.entryId, occurrenceMonth: occ.month })}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="Excluir" onClick={() => askDelete(occ)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography fontWeight={600}>
                          {occ.description}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={occ.categoryName ?? "Sem categoria"} />
                          <Chip size="small" variant="outlined" label={RECURRENCE_LABEL[occ.recurrence]} />
                          {occ.installmentLabel && (
                            <Chip size="small" variant="outlined" label={`Parcela ${occ.installmentLabel}`} />
                          )}
                        </Stack>
                      }
                    />
                    <Typography
                      sx={{
                        mr: 9,
                        fontWeight: 700,
                        color: occ.type === "RECEITA" ? RECEITA_COLOR : DESPESA_COLOR,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {occ.type === "RECEITA" ? "+" : "-"} {formatMoney(occ.amount)}
                    </Typography>
                  </ListItem>
                </Box>
              ))}
            </List>
          ) : (
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Nenhum lancamento neste mes com os filtros atuais.
              </Typography>
            </CardContent>
          )}
        </Card>
      )}

      {/* Criacao / Edicao (formulario completo) */}
      <EntryFormDialog
        open={!!editing || creating}
        editing={editing}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSaved={() => queryClient.invalidateQueries()}
        categories={categoriesQuery.data ?? []}
        defaultMonth={month}
      />

      {/* Exclusao com alcance (recorrentes) */}
      <ScopeDialog
        open={!!deleteScopeFor}
        title="Excluir lancamento"
        action="delete"
        onClose={() => setDeleteScopeFor(null)}
        onConfirm={(scope) => {
          const occ = deleteScopeFor;
          setDeleteScopeFor(null);
          if (occ) void runDelete(occ, scope);
        }}
      />

      {/* Exclusao simples (unico) */}
      <ConfirmDialog
        open={!!confirmFor}
        title="Excluir lancamento"
        message={`Excluir "${confirmFor?.description}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        onClose={() => setConfirmFor(null)}
        onConfirm={() => {
          const occ = confirmFor;
          setConfirmFor(null);
          if (occ) void runDelete(occ);
        }}
      />
    </Box>
  );
}
