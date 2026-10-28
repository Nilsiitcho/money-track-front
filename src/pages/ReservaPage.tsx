import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Typography, Button, Stack, Alert, CircularProgress, Divider,
  Checkbox, FormControlLabel,
} from "@mui/material";
import SavingsIcon from "@mui/icons-material/Savings";
import { MonthSelector } from "../components/MonthSelector";
import { MoneyField } from "../components/MoneyField";
import { getReserva, setReserva } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { currentMonth, formatMoney, formatMonthLong, shiftMonth } from "../lib/format";
import { DESPESA_COLOR } from "../theme";

export function ReservaPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonth());
  const [draft, setDraft] = useState(0);
  // Se marcado, a reserva passa a valer a partir do proximo mes (ignora o mes atual).
  const [fromNextMonth, setFromNextMonth] = useState(false);
  const nextMonth = shiftMonth(currentMonth(), 1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["reserva", month],
    queryFn: () => getReserva(month),
  });

  // Sincroniza o campo com o valor salvo quando chega do backend.
  useEffect(() => {
    if (data) setDraft(data.amount);
  }, [data?.amount]);

  const mutation = useMutation({
    mutationFn: () => setReserva(draft, month, fromNextMonth ? nextMonth : undefined),
    onSuccess: (res) => {
      queryClient.setQueryData(["reserva", month], res);
      queryClient.invalidateQueries();
      setFromNextMonth(false);
    },
  });

  const dirty = data != null && draft !== data.amount;
  const canSave = dirty || fromNextMonth;

  return (
    <Box>
      <MonthSelector month={month} onChange={setMonth} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage(error)}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <Stack spacing={2}>
          {/* Destaque: orcamento diario */}
          <Card sx={{ borderLeft: "4px solid", borderLeftColor: DESPESA_COLOR }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <SavingsIcon sx={{ color: DESPESA_COLOR }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Orcamento diario
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: DESPESA_COLOR }}>
                {formatMoney(data.dailyBudget)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatMoney(data.amount)} ÷ {data.daysInMonth} dias de {formatMonthLong(month)}
              </Typography>
            </CardContent>
          </Card>

          {/* Definir o valor da reserva */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Reserva
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Valor mensal para gastos variaveis. Lancado automaticamente como despesa fixa.
              </Typography>
              <Stack spacing={2}>
                <MoneyField label="Valor da reserva" value={draft} onChange={setDraft} />
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={fromNextMonth}
                        onChange={(e) => setFromNextMonth(e.target.checked)}
                      />
                    }
                    label="Desconsiderar mes atual?"
                  />
                  {fromNextMonth && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 4, mt: -0.5 }}>
                      A reserva passa a valer a partir de {formatMonthLong(nextMonth)}.
                    </Typography>
                  )}
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  {(dirty || fromNextMonth) && (
                    <Button
                      color="inherit"
                      onClick={() => { setDraft(data.amount); setFromNextMonth(false); }}
                      disabled={mutation.isPending}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={() => mutation.mutate()}
                    disabled={!canSave || mutation.isPending}
                  >
                    {mutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </Box>
                {mutation.isError && (
                  <Alert severity="error">{errorMessage(mutation.error)}</Alert>
                )}
                {draft === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Salvar com valor 0 remove a reserva.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}
    </Box>
  );
}
