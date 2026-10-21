import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, IconButton, CircularProgress, Alert, Button, Chip, Tooltip, Fade,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon2 from "@mui/icons-material/KeyboardArrowRight";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SavingsIcon from "@mui/icons-material/Savings";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getGrid } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { currentMonth, formatCell, formatMoney, formatMonthShort, shiftMonth } from "../lib/format";
import { RECEITA_COLOR, DESPESA_COLOR } from "../theme";
import type { GridCategoryRow } from "../api/types";

const MONTHS = 12;
const FIRST_COL = 220;
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
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function ReportPage() {
  const [from, setFrom] = useState(currentMonth());
  // Simulacao (apenas na sessao): ids de lancamentos ocultos e categorias expandidas.
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const excluded = [...hidden].sort((a, b) => a - b);
  const { data, isLoading, error } = useQuery({
    queryKey: ["grid", from, MONTHS, excluded.join(",")],
    queryFn: () => getGrid(from, MONTHS, excluded),
    // mantem a tabela anterior enquanto recalcula (sem flash de spinner ao ocultar/exibir)
    placeholderData: keepPreviousData,
  });

  const months = data?.months ?? [];
  const rangeLabel =
    months.length > 0 ? `${formatMonthShort(months[0])} – ${formatMonthShort(months[months.length - 1])}` : "";

  // Alerta: primeiro mes da janela em que o saldo projetado fica negativo.
  const firstNegIdx = (data?.accumulated ?? []).findIndex((v) => v < 0);

  function toggleHidden(entryId: number) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(entryId) ? next.delete(entryId) : next.add(entryId);
      return next;
    });
  }

  function toggleExpanded(categoryId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  }

  function numCell(value: number, key: number, color?: string, bold?: boolean, muted?: boolean, celebrate?: boolean) {
    const negative = value < 0;
    const party = celebrate && value !== 0 && !muted;
    return (
      <TableCell
        key={key}
        align="right"
        sx={{
          minWidth: CELL_MIN,
          whiteSpace: "nowrap",
          fontWeight: bold ? 700 : 400,
          color: muted ? "text.disabled" : negative ? DESPESA_COLOR : color,
          textDecoration: muted ? "line-through" : "none",
        }}
      >
        {party ? (
          <Tooltip title="Ultima parcela — divida quitada!">
            <Box component="span" sx={{ whiteSpace: "nowrap" }}>
              {formatCell(value)} <span aria-label="comemoracao">🎉</span>
            </Box>
          </Tooltip>
        ) : (
          formatCell(value)
        )}
      </TableCell>
    );
  }

  function entryRows(rows: GridCategoryRow["entries"], color: string) {
    return rows.map((e) => {
      const isHidden = hidden.has(e.entryId);
      return (
        <TableRow key={`e-${e.entryId}`} sx={{ bgcolor: "action.hover" }}>
          <TableCell sx={{ ...stickyLeft, bgcolor: "background.paper", fontWeight: 400, pl: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title={isHidden ? "Exibir no calculo" : "Ocultar do calculo"}>
                <IconButton
                  size="small"
                  onClick={() => toggleHidden(e.entryId)}
                  aria-label={isHidden ? "Exibir lancamento" : "Ocultar lancamento"}
                  sx={{ color: isHidden ? "text.disabled" : "primary.main" }}
                >
                  {isHidden ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title={e.label}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ color: isHidden ? "text.disabled" : "text.primary", textDecoration: isHidden ? "line-through" : "none" }}
                >
                  {e.label}
                </Typography>
              </Tooltip>
            </Box>
          </TableCell>
          {e.values.map((v, i) => numCell(v, i, color, false, isHidden, e.finalMonth === months[i]))}
        </TableRow>
      );
    });
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
    return rows.map((r) => {
      // Reserva: linha unica (nao e categoria expansivel), com olho inline para simulacao.
      if (r.kind === "RESERVA") {
        return [reservaRow(r, color)];
      }
      // Excedente de Reserva: linha derivada (soma dos gastos acima da reserva).
      if (r.kind === "RESERVA_EXCESS") {
        return [excedenteRow(r)];
      }
      // Lancamento sem categoria: linha unica no grupo.
      if (r.kind === "SINGLE") {
        return [singleRow(r, color)];
      }
      const catId = r.categoryId ?? 0;
      const isOpen = expanded.has(catId);
      return [
        <TableRow key={`c-${catId}`} hover>
          <TableCell
            sx={{ ...stickyLeft, fontWeight: 600, cursor: "pointer", userSelect: "none" }}
            onClick={() => toggleExpanded(catId)}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isOpen ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon2 fontSize="small" />}
              <Tooltip title={r.name}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {r.name}
                </Typography>
              </Tooltip>
            </Box>
          </TableCell>
          {r.values.map((v, i) => numCell(v, i, color))}
        </TableRow>,
        ...(isOpen ? entryRows(r.entries, color) : []),
      ];
    });
  }

  // Linha unica de um lancamento sem categoria (com olho para a simulacao).
  function singleRow(r: GridCategoryRow, color: string) {
    const entry = r.entries[0];
    const isHidden = entry ? hidden.has(entry.entryId) : false;
    const values = entry ? entry.values : r.values;
    return (
      <TableRow key={`s-${entry?.entryId ?? r.name}`} hover>
        <TableCell sx={{ ...stickyLeft, fontWeight: 400 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {entry && (
              <Tooltip title={isHidden ? "Exibir no calculo" : "Ocultar do calculo"}>
                <IconButton
                  size="small"
                  onClick={() => toggleHidden(entry.entryId)}
                  aria-label={isHidden ? "Exibir lancamento" : "Ocultar lancamento"}
                  sx={{ color: isHidden ? "text.disabled" : "primary.main" }}
                >
                  {isHidden ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={r.name}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: 600, color: isHidden ? "text.disabled" : "text.primary", textDecoration: isHidden ? "line-through" : "none" }}
              >
                {r.name}
              </Typography>
            </Tooltip>
          </Box>
        </TableCell>
        {values.map((v, i) => numCell(v, i, color, false, isHidden, entry?.finalMonth === months[i]))}
      </TableRow>
    );
  }

  // Linha do Excedente de Reserva: destaque mais forte (vermelho), nao ocultavel.
  function excedenteRow(r: GridCategoryRow) {
    const accent = { bgcolor: "rgba(198,40,40,0.14)" };
    return (
      <TableRow key={`c-${r.categoryId}`}>
        <TableCell
          sx={{ ...stickyLeft, ...accent, borderLeft: "3px solid", borderLeftColor: DESPESA_COLOR, color: DESPESA_COLOR }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 3.5 }}>
            <Tooltip title={r.name}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: DESPESA_COLOR }}>
                {r.name}
              </Typography>
            </Tooltip>
          </Box>
        </TableCell>
        {r.values.map((v, i) => (
          <TableCell
            key={i}
            align="right"
            sx={{ ...accent, minWidth: CELL_MIN, whiteSpace: "nowrap", fontWeight: 700, color: DESPESA_COLOR }}
          >
            {formatCell(v)}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  // Linha unica da Reserva: distincao leve + olho para ocultar na simulacao.
  function reservaRow(r: GridCategoryRow, color: string) {
    const entry = r.entries[0];
    const isHidden = entry ? hidden.has(entry.entryId) : false;
    const values = entry ? entry.values : r.values;
    const accent = { bgcolor: "rgba(198,40,40,0.06)" };
    return (
      <TableRow key={`c-${r.categoryId}`} hover sx={accent}>
        <TableCell
          sx={{ ...stickyLeft, ...accent, borderLeft: "3px solid", borderLeftColor: DESPESA_COLOR }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {entry && (
              <Tooltip title={isHidden ? "Exibir no calculo" : "Ocultar do calculo"}>
                <IconButton
                  size="small"
                  onClick={() => toggleHidden(entry.entryId)}
                  aria-label={isHidden ? "Exibir reserva" : "Ocultar reserva"}
                  sx={{ color: isHidden ? "text.disabled" : "primary.main" }}
                >
                  {isHidden ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            <SavingsIcon fontSize="small" sx={{ color: isHidden ? "text.disabled" : DESPESA_COLOR }} />
            <Tooltip title={r.name}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: 600, fontStyle: "italic", color: isHidden ? "text.disabled" : "text.primary", textDecoration: isHidden ? "line-through" : "none" }}
              >
                {r.name}
              </Typography>
            </Tooltip>
          </Box>
        </TableCell>
        {values.map((v, i) => numCell(v, i, color, false, isHidden))}
      </TableRow>
    );
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            Saldo Projetado
            <Tooltip title="Soma dos saldos mensais desde o primeiro lancamento. Comeca do zero e os meses futuros sao projecao com base nos lancamentos cadastrados.">
              <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
            </Tooltip>
          </Box>
        </TableCell>
        {values.map((v, i) => {
          const firstNeg = values.findIndex((x) => x < 0) === i;
          return (
            <TableCell
              key={i}
              align="right"
              sx={{
                ...cellSx,
                color: v < 0 ? DESPESA_COLOR : "primary.dark",
                ...(firstNeg ? { bgcolor: "rgba(237,108,2,0.16)" } : {}),
              }}
            >
              {firstNeg ? (
                <Tooltip title="Primeiro mes com saldo projetado negativo">
                  <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                    <WarningAmberIcon fontSize="inherit" sx={{ verticalAlign: "-2px", mr: 0.25 }} /> {formatCell(v)}
                  </Box>
                </Tooltip>
              ) : (
                formatCell(v)
              )}
            </TableCell>
          );
        })}
      </TableRow>
    );
  }

  return (
    <Box>
      {/* Toolbar fixa: navegacao de meses + status da simulacao (espaco reservado, sem "pulo") */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, minHeight: 40 }}>
        <IconButton onClick={() => setFrom(shiftMonth(from, -1))} aria-label="Meses anteriores">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flexGrow: 1, textAlign: "center" }}>
          {rangeLabel}
        </Typography>
        <IconButton onClick={() => setFrom(shiftMonth(from, 1))} aria-label="Proximos meses">
          <ChevronRightIcon />
        </IconButton>
        <Fade in={hidden.size > 0}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 0.5 }}>
            <Tooltip title={`${hidden.size} lancamento(s) oculto(s) dos totais`}>
              <Chip
                size="small"
                color="info"
                icon={<VisibilityOffIcon fontSize="small" />}
                label={hidden.size}
              />
            </Tooltip>
            <Button size="small" onClick={() => setHidden(new Set())}>
              Limpar
            </Button>
          </Box>
        </Fade>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage(error)}</Alert>}

      {data && firstNegIdx >= 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon fontSize="inherit" />} sx={{ mb: 2 }}>
          Saldo projetado fica <strong>negativo</strong> em {formatMonthShort(months[firstNegIdx])}{" "}
          ({formatMoney(data.accumulated[firstNegIdx])}).
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <Card>
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Toque numa categoria para ver os lancamentos e usar o olho para ocultar/exibir nos calculos.
            </Typography>
          </Box>
          <TableContainer sx={{ maxHeight: "70dvh" }}>
            {/* tableLayout fixed + colgroup: larguras travadas (nao mudam ao ocultar/exibir);
                width 100% + minWidth faz as colunas crescerem em telas largas e rolar nas estreitas */}
            <Table
              stickyHeader
              size="small"
              sx={{ tableLayout: "fixed", width: "100%", minWidth: FIRST_COL + CELL_MIN * MONTHS }}
            >
              <colgroup>
                <col style={{ width: FIRST_COL }} />
                {months.map((m) => (
                  <col key={m} />
                ))}
              </colgroup>
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
