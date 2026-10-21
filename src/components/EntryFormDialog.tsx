import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField,
  MenuItem, ToggleButton, ToggleButtonGroup, Alert, Typography,
} from "@mui/material";
import { MoneyField } from "./MoneyField";
import { MonthField } from "./MonthField";
import { ScopeDialog } from "./ScopeDialog";
import { getEntry, createEntry, updateEntry } from "../api/endpoints";
import { errorMessage } from "../api/client";
import type { Category, EditScope, EntryType, Recurrence } from "../api/types";

const schema = z
  .object({
    type: z.enum(["RECEITA", "DESPESA"]),
    description: z.string().trim().min(1, "Informe a descricao").max(255, "Maximo 255 caracteres"),
    amount: z.number().positive("Valor deve ser maior que zero"),
    categoryId: z.number().int().positive().nullable(),
    recurrence: z.enum(["UNICO", "FIXO", "PARCELADO"]),
    startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Informe o mes"),
    parceladoMode: z.enum(["installments", "end"]),
    installments: z.number().int().min(1, "Minimo 1 parcela").optional(),
    endMonth: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.recurrence !== "PARCELADO") return;
    if (v.parceladoMode === "installments") {
      if (!v.installments || v.installments < 1) {
        ctx.addIssue({ path: ["installments"], code: z.ZodIssueCode.custom, message: "Informe as parcelas" });
      }
    } else {
      if (!v.endMonth || !/^\d{4}-\d{2}$/.test(v.endMonth)) {
        ctx.addIssue({ path: ["endMonth"], code: z.ZodIssueCode.custom, message: "Informe o mes de termino" });
      } else if (v.endMonth < v.startMonth) {
        ctx.addIssue({ path: ["endMonth"], code: z.ZodIssueCode.custom, message: "Termino antes do inicio" });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

function defaults(month: string): FormValues {
  return {
    type: "DESPESA",
    description: "",
    amount: 0,
    categoryId: null,
    recurrence: "UNICO",
    startMonth: month,
    parceladoMode: "installments",
    installments: 2,
    endMonth: "",
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  defaultMonth: string;
  editing?: { entryId: number; occurrenceMonth: string } | null;
}

export function EntryFormDialog({ open, onClose, onSaved, categories, defaultMonth, editing }: Props) {
  const isEdit = !!editing;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(defaultMonth),
  });

  const recurrence = watch("recurrence");
  const parceladoMode = watch("parceladoMode");

  const ruleQuery = useQuery({
    queryKey: ["entry", editing?.entryId],
    queryFn: () => getEntry(editing!.entryId),
    enabled: open && isEdit,
  });

  // Preenche o formulario ao abrir
  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      reset(defaults(defaultMonth));
      setError(null);
      return;
    }
    const rule = ruleQuery.data;
    if (rule) {
      reset({
        type: rule.type,
        description: rule.description,
        amount: rule.amount,
        categoryId: rule.categoryId,
        recurrence: rule.recurrence,
        startMonth: rule.startMonth,
        parceladoMode: "installments",
        installments: rule.installmentTotal ?? 2,
        endMonth: rule.endMonth ?? "",
      });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, ruleQuery.data, defaultMonth]);

  // Opcoes de categoria (inclui a do lancamento editado mesmo se arquivada)
  const options = [...categories];
  const rule = ruleQuery.data;
  if (rule && rule.categoryId != null && !options.some((c) => c.id === rule.categoryId)) {
    options.push({ id: rule.categoryId, name: rule.categoryName ?? "", archived: true });
  }

  async function persist(values: FormValues, scope?: EditScope) {
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateEntry(editing!.entryId, {
          type: values.type,
          description: values.description,
          amount: values.amount,
          categoryId: values.categoryId,
          scope: scope ?? "ALL",
          referenceMonth: editing!.occurrenceMonth,
        });
      } else {
        await createEntry({
          type: values.type,
          description: values.description,
          amount: values.amount,
          categoryId: values.categoryId,
          recurrence: values.recurrence,
          startMonth: values.startMonth,
          endMonth: values.recurrence === "PARCELADO" && values.parceladoMode === "end" ? values.endMonth : null,
          installments:
            values.recurrence === "PARCELADO" && values.parceladoMode === "installments"
              ? values.installments
              : null,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Nao foi possivel salvar"));
    } finally {
      setSaving(false);
    }
  }

  function onValid(values: FormValues) {
    // Edicao de recorrentes pergunta o alcance
    if (isEdit && rule && rule.recurrence !== "UNICO") {
      setPendingValues(values);
      setScopeOpen(true);
      return;
    }
    void persist(values);
  }

  const startLabel = recurrence === "UNICO" ? "Mes" : "Mes inicial";

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={window.innerWidth < 600}>
        <DialogTitle>{isEdit ? "Editar lancamento" : "Novo lancamento"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  color="primary"
                  value={field.value}
                  onChange={(_, val: EntryType | null) => val && field.onChange(val)}
                >
                  <ToggleButton value="DESPESA">Despesa</ToggleButton>
                  <ToggleButton value="RECEITA">Receita</ToggleButton>
                </ToggleButtonGroup>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Descricao" error={!!errors.description} helperText={errors.description?.message} autoFocus={!isEdit} />
              )}
            />

            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <MoneyField
                  label="Valor"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                />
              )}
            />

            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Categoria (opcional)"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                  error={!!errors.categoryId}
                  helperText={errors.categoryId?.message}
                >
                  <MenuItem value="">Sem categoria</MenuItem>
                  {options.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                      {c.archived ? " (arquivada)" : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="recurrence"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Recorrencia"
                  disabled={isEdit}
                  onChange={(e) => field.onChange(e.target.value as Recurrence)}
                  helperText={isEdit ? "Recorrencia nao pode ser alterada; exclua e recrie" : undefined}
                >
                  <MenuItem value="UNICO">Unico</MenuItem>
                  <MenuItem value="FIXO">Fixo (todo mes)</MenuItem>
                  <MenuItem value="PARCELADO">Parcelado</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="startMonth"
              control={control}
              render={({ field }) => (
                <MonthField
                  label={startLabel}
                  value={field.value}
                  onChange={(m) => field.onChange(m ?? "")}
                  disabled={isEdit}
                  error={!!errors.startMonth}
                  helperText={errors.startMonth?.message}
                />
              )}
            />

            {recurrence === "PARCELADO" && (
              <>
                <Controller
                  name="parceladoMode"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      size="small"
                      value={field.value}
                      disabled={isEdit}
                      onChange={(_, val) => val && field.onChange(val)}
                    >
                      <ToggleButton value="installments">Qtd. parcelas</ToggleButton>
                      <ToggleButton value="end">Mes de termino</ToggleButton>
                    </ToggleButtonGroup>
                  )}
                />
                {parceladoMode === "installments" ? (
                  <Controller
                    name="installments"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        label="Numero de parcelas"
                        type="number"
                        disabled={isEdit}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        error={!!errors.installments}
                        helperText={errors.installments?.message}
                        inputProps={{ min: 1, inputMode: "numeric" }}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    name="endMonth"
                    control={control}
                    render={({ field }) => (
                      <MonthField
                        label="Mes de termino"
                        value={field.value || null}
                        onChange={(m) => field.onChange(m ?? "")}
                        disabled={isEdit}
                        error={!!errors.endMonth}
                        helperText={errors.endMonth?.message}
                      />
                    )}
                  />
                )}
                {isEdit && (
                  <Typography variant="caption" color="text.secondary">
                    Datas e parcelas sao fixas na edicao.
                  </Typography>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onValid)} disabled={saving || (isEdit && ruleQuery.isLoading)}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

      <ScopeDialog
        open={scopeOpen}
        title="Alcance da alteracao"
        action="edit"
        onClose={() => setScopeOpen(false)}
        onConfirm={(scope) => {
          setScopeOpen(false);
          if (pendingValues) void persist(pendingValues, scope);
        }}
      />
    </>
  );
}
