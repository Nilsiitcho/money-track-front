import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, IconButton, CircularProgress, Alert,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { getGrid } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { currentMonth, formatCell, formatMonthShort, shiftMonth } from "../lib/format";
import { RECEITA_COLOR, DESPESA_COLOR } from "../theme";
import type { GridCategoryRow } from "../api/types";

const MONTHS = 12;
const FIRST_COL = 132;
const CELL_MIN = 78;

// Celula da primeira coluna: fixa ao rolar horizontalmente
const stickyLeft = {
  position: "sticky" as const,
  left: 0,
  zIndex: 2,
  bgcolor: "background.paper",
  minWidth: FIRST_COL,
  maxWidth: FIRST_COL,
  fontWeight: 600,
};

export function ReportPage() {
  const [from, setFrom] = useState(currentMonth());
  const { data, isLoading, error } = useQuery({
    queryKey: ["grid", from, MONTHS],
    queryFn: () => getGrid(from, MONTHS),
  });

  const months = data?.months ?? [];
  const rangeLabel =
    months.length > 0 ? `${formatMonthShort(months[0])} – ${formatMonthShort(months[months.length - 1])}` : "";

  function numCell(value: number, key: number, color?: string, bold?: boolean) {
    const negative = value < 0;
    return (
      <TableCell
        key={key}
        align="right"
        sx={{
          minWidth: CELL_MIN,
          whiteSpace: "nowrap",
          fontWeight: bold ? 700 : 400,
          color: negative ? DESPESA_COLOR : color,
        }}
      >
        {formatCell(value)}
      </TableCell>
    );
  }

  function categoryRows(rows: GridCategoryRow[], color: string) {
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell sx={stickyLeft}>—</TableCell>
          <TableCell colSpan={MONTHS} sx={{ color: "text.secondary" }}>
            Nenhuma
          </TableCell>
        </TableRow>
      );
    }
    return rows.map((r) => (
      <TableRow key={r.categoryId} hover>
        <TableCell sx={{ ...stickyLeft, fontWeight: 400 }}>{r.name}</TableCell>
        {r.values.map((v, i) => numCell(v, i, color))}
      </TableRow>
    ));
  }

  function sectionRow(label: string) {
    return (
      <TableRow>
        <TableCell sx={{ ...stickyLeft, bgcolor: "grey.100" }}>{label}</TableCell>
        <TableCell colSpan={MONTHS} sx={{ bgcolor: "grey.100" }} />
      </TableRow>
    );
  }

  function totalRow(label: string, values: number[], color?: string) {
    return (
      <TableRow>
        <TableCell sx={{ ...stickyLeft, bgcolor: "grey.50", fontWeight: 700 }}>{label}</TableCell>
        {values.map((v, i) => numCell(v, i, color, true))}
      </TableRow>
    );
  }

  // Linha de saldo acumulado: estilo de destaque (fundo azul, borda, texto maior)
  function accumulatedRow(values: number[]) {
    const cellSx = {
      minWidth: CELL_MIN,
      whiteSpace: "nowrap" as const,
      fontWeight: 700,
      fontSize: "0.9rem",
      bgcolor: "#e8f2fc",
      borderTop: "2px solid",
      borderTopColor: "primary.main",
    };
    return (
      <TableRow>
        <TableCell
          sx={{
            ...stickyLeft,
            bgcolor: "#e8f2fc",
            color: "primary.dark",
            fontSize: "0.9rem",
            borderTop: "2px solid",
            borderTopColor: "primary.main",
          }}
        >
          Saldo acumulado
        </TableCell>
        {values.map((v, i) => (
          <TableCell
            key={i}
            align="right"
            sx={{ ...cellSx, color: v < 0 ? DESPESA_COLOR : "primary.dark" }}
          >
            {formatCell(v)}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <IconButton onClick={() => setFrom(shiftMonth(from, -1))} aria-label="Meses anteriores">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600}>
          {rangeLabel}
        </Typography>
        <IconButton onClick={() => setFrom(shiftMonth(from, 1))} aria-label="Proximos meses">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage(error)}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <Card>
          <TableContainer sx={{ maxHeight: "70dvh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...stickyLeft, zIndex: 3, top: 0 }}>Categoria</TableCell>
                  {months.map((m) => (
                    <TableCell key={m} align="right" sx={{ minWidth: CELL_MIN, whiteSpace: "nowrap", fontWeight: 600, textTransform: "capitalize" }}>
                      {formatMonthShort(m)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sectionRow("RECEITAS")}
                {categoryRows(data.receitas, RECEITA_COLOR)}
                {totalRow("Total receitas", data.totalReceitas, RECEITA_COLOR)}

                {sectionRow("DESPESAS")}
                {categoryRows(data.despesas, DESPESA_COLOR)}
                {totalRow("Total despesas", data.totalDespesas, DESPESA_COLOR)}

                {totalRow("Saldo do mes", data.saldo)}
                {accumulatedRow(data.accumulated)}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : null}
    </Box>
  );
}
