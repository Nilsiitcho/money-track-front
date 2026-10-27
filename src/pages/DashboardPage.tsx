import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, CircularProgress, Alert, Stack,
  LinearProgress, Button,
} from "@mui/material";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { MonthSelector } from "../components/MonthSelector";
import { getDashboard, getReservaStatus } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { currentMonth, formatMoney, formatMonthLabel } from "../lib/format";
import { CHART_COLORS, DESPESA_COLOR, RECEITA_COLOR } from "../theme";

// Tooltip dos graficos no tema grafite.
const CHART_TOOLTIP = {
  background: "#1f242b",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "#e6e8eb",
} as const;

function SummaryCard({ title, value, color }: { title: string; value: number; color?: string }) {
  return (
    <Card>
      <CardContent sx={{ py: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h6" fontWeight={700} sx={{ color }}>
          {formatMoney(value)}
        </Typography>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontWeight: 700, whiteSpace: "nowrap", color: highlight ? "primary.main" : undefined }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// Card principal: orcamento mensal (Reserva) — disponivel, gasto e diario recomendado.
function BudgetCard({ month }: { month: string }) {
  const navigate = useNavigate();
  const isCurrent = month === currentMonth();
  const { data } = useQuery({
    queryKey: ["reservaStatus", month],
    queryFn: () => getReservaStatus(isCurrent ? undefined : `${month}-01`),
  });
  if (!data) return null;

  const { reserva, spentMonth, remainingMonth, dailyAvailable, daysRemaining } = data;
  const hasBudget = reserva > 0;
  const pct = hasBudget ? Math.min(100, Math.max(0, (spentMonth / reserva) * 100)) : 0;
  const over = remainingMonth < 0;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="text.secondary">
            Orcamento do mes (Reserva)
          </Typography>
          <Button size="small" variant="text" onClick={() => navigate("/reserva")}>
            Ajustar
          </Button>
        </Stack>

        {!hasBudget ? (
          <Stack spacing={1.5} alignItems="flex-start" sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Defina sua reserva de gastos para acompanhar o orcamento e o gasto diario.
            </Typography>
            <Button onClick={() => navigate("/reserva")}>Definir reserva</Button>
          </Stack>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Disponivel
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, lineHeight: 1.1, color: over ? DESPESA_COLOR : "primary.main" }}
            >
              {formatMoney(remainingMonth)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={pct}
              color={over ? "error" : "primary"}
              sx={{ height: 10, borderRadius: 5, my: 1.5 }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                gap: 1.5,
              }}
            >
              <Stat label="Orcamento" value={formatMoney(reserva)} />
              <Stat label="Gasto" value={formatMoney(spentMonth)} />
              <Stat
                label={isCurrent ? "Diario recomendado" : "Diario"}
                value={formatMoney(dailyAvailable)}
                highlight
              />
              {isCurrent && <Stat label="Dias restantes" value={String(daysRemaining)} />}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", month],
    queryFn: () => getDashboard(month),
  });

  const saldoColor = (data?.totals.saldo ?? 0) >= 0 ? RECEITA_COLOR : DESPESA_COLOR;
  const accColor = (data?.accumulated ?? 0) >= 0 ? RECEITA_COLOR : DESPESA_COLOR;

  const series = (data?.series ?? []).map((p) => ({
    month: formatMonthLabel(p.month),
    Saldo: p.saldo,
    Projetado: p.accumulated,
  }));

  return (
    <Box>
      <MonthSelector month={month} onChange={setMonth} />

      {isLoading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error">{errorMessage(error)}</Alert>}

      {data && (
        <Stack spacing={2}>
          <BudgetCard month={month} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 1.5,
            }}
          >
            <SummaryCard title="Receitas" value={data.totals.receitas} color={RECEITA_COLOR} />
            <SummaryCard title="Despesas" value={data.totals.despesas} color={DESPESA_COLOR} />
            <SummaryCard title="Saldo do mes" value={data.totals.saldo} color={saldoColor} />
            <SummaryCard title="Saldo projetado" value={data.accumulated} color={accColor} />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Evolucao do saldo
              </Typography>
              {series.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Sem dados ainda.
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" tick={{ fill: "#9aa1a9", fontSize: 11 }} stroke="rgba(255,255,255,0.15)" />
                    <YAxis width={48} tick={{ fill: "#9aa1a9", fontSize: 11 }} stroke="rgba(255,255,255,0.15)" />
                    <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={CHART_TOOLTIP} labelStyle={{ color: "#e6e8eb" }} itemStyle={{ color: "#e6e8eb" }} />
                    <Legend wrapperStyle={{ color: "#9aa1a9", fontSize: 12 }} />
                    <Line type="monotone" dataKey="Saldo" stroke={RECEITA_COLOR} dot={false} />
                    <Line type="monotone" dataKey="Projetado" stroke="#ff6a1a" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
            </Card>
            <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Despesas por categoria
              </Typography>
              {data.byCategory.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma despesa no mes.
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(e) => e.name}
                    >
                      {data.byCategory.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={CHART_TOOLTIP} labelStyle={{ color: "#e6e8eb" }} itemStyle={{ color: "#e6e8eb" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
            </Card>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
