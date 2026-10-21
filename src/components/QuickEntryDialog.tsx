import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography,
  Box, Alert, Divider, TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { MoneyField } from "./MoneyField";
import { getReservaStatus, createGastoRapido } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { formatMoney } from "../lib/format";
import { DESPESA_COLOR, RECEITA_COLOR } from "../theme";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function Line({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700} sx={{ color }}>{value}</Typography>
    </Box>
  );
}

export function QuickEntryDialog({ open, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [description, setDescription] = useState("");

  const dateStr = date.format("YYYY-MM-DD");
  const statusQuery = useQuery({
    queryKey: ["reserva-status", dateStr],
    queryFn: () => getReservaStatus(dateStr),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => createGastoRapido(amount, dateStr, description || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries();
      onSaved?.();
      handleClose();
    },
  });

  function handleClose() {
    setAmount(0);
    setDate(dayjs());
    setDescription("");
    onClose();
  }

  const s = statusQuery.data;
  const dr = s?.daysRemaining ?? 0;
  const remainingAfter = s ? s.remainingMonth - amount : 0;
  const dailyAfter = dr > 0 ? remainingAfter / dr : remainingAfter;
  const exceeds = remainingAfter < 0;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Lancamento rapido</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <MoneyField label="Valor" value={amount} onChange={setAmount} />
          <DatePicker
            label="Data"
            value={date}
            onChange={(d) => d && setDate(d)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { fullWidth: true } }}
          />
          <TextField
            label="Descricao (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
          />

          <Divider />

          {s && s.reserva === 0 && (
            <Alert severity="warning">
              Sem Reserva definida. Defina na aba Reserva — por ora o gasto conta como excedente.
            </Alert>
          )}

          {/* Painel do orcamento */}
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
            <Stack spacing={0.75}>
              <Line label="Reserva do mes" value={formatMoney(s?.reserva ?? 0)} />
              <Line label="Ja gasto no mes" value={formatMoney(s?.spentMonth ?? 0)} />
              <Line
                label="Saldo diario disponivel"
                value={formatMoney(s?.dailyAvailable ?? 0)}
                color={(s?.dailyAvailable ?? 0) < 0 ? DESPESA_COLOR : RECEITA_COLOR}
              />
              <Divider sx={{ my: 0.5 }} />
              <Line
                label="Restante da reserva (apos)"
                value={formatMoney(remainingAfter)}
                color={exceeds ? DESPESA_COLOR : undefined}
              />
              <Line
                label="Saldo diario ajustado (apos)"
                value={formatMoney(dailyAfter)}
                color={dailyAfter < 0 ? DESPESA_COLOR : RECEITA_COLOR}
              />
            </Stack>
          </Box>

          {exceeds && amount > 0 && (
            <Alert severity="info">Este gasto excede a reserva do mes — o excedente aparecera na tabela.</Alert>
          )}
          {mutation.isError && <Alert severity="error">{errorMessage(mutation.error)}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose} disabled={mutation.isPending}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={amount <= 0 || mutation.isPending}
        >
          {mutation.isPending ? "Salvando..." : "Lancar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
