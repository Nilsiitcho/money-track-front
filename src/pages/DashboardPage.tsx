import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Typography, CircularProgress, Alert, Stack,
} from "@mui/material";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { MonthSelector } from "../components/MonthSelector";
import { getDashboard } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { currentMonth, formatMoney, formatMonthLabel } from "../lib/format";
import { CHART_COLORS, DESPESA_COLOR, RECEITA_COLOR } from "../theme";

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
    Acumulado: p.accumulated,
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
            <SummaryCard title="Saldo acumulado" value={data.accumulated} color={accColor} />
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} width={48} />
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="Saldo" stroke={RECEITA_COLOR} dot={false} />
                    <Line type="monotone" dataKey="Acumulado" stroke="#1e88e5" dot={false} />
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
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
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
