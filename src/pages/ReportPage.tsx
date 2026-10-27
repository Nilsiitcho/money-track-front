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
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { getGrid } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { currentMonth, formatCell, formatMoney, formatMonthShort, shiftMonth } from "../lib/format";
import { RECEITA_COLOR, DESPESA_COLOR } from "../theme";
import type { GridCategoryRow } from "../api/types";

const MONTHS = 12;
const FIRST_COL = 220;
const CELL_MIN = 78;
// Alturas fixas para empilhar os totalizadores sticky no topo (header + 4 linhas).
const HEAD_H = 37;
const SUM_H = 37;
// Realces e faixas (tema grafite escuro): tints translucidos p/ nao brigar com o texto claro.
const NEG_BG = "rgba(240,87,92,0.22)"; // celula de saldo negativo
const REC_BG = "rgba(63,191,106,0.20)"; // celula de recuperacao (volta positivo)
const SECTION_BG = "#2b3139"; // faixa de secao (RECEITAS/DESPESAS)
const SUM_BG = "#232931"; // faixa dos totalizadores
const PROJ_BG = "rgba(255,106,26,0.16)"; // faixa do Saldo Projetado (tint laranja)

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

  // Alerta: 1o mes negativo e, depois dele, o 1o mes que volta a positivo.
  const acc = data?.accumulated ?? [];
  const firstNegIdx = acc.findIndex((v) => v < 0);
  const recoveryIdx = firstNegIdx >= 0 ? acc.findIndex((v, i) => i > firstNegIdx && v >= 0) : -1;

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
    const accent = { bgcolor: "rgba(240,87,92,0.20)" };
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
    const accent = { bgcolor: "rgba(240,87,92,0.10)" };
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
        <TableCell sx={{ ...stickyLeft, bgcolor: SECTION_BG, fontWeight: 700 }}>{label}</TableCell>
        <TableCell colSpan={MONTHS} sx={{ bgcolor: SECTION_BG }} />
      </TableRow>
    );
  }

  // Linha totalizadora sticky no topo (empilhada abaixo do header de meses).
  // projected=true aplica o estilo do Saldo Projetado + marcadores de negativo/recuperacao.
  function summaryRow(
    label: string, values: number[], top: number, bg: string, color?: string, projected?: boolean,
  ) {
    const negIdx = projected ? values.findIndex((x) => x < 0) : -1;
    const recIdx = negIdx >= 0 ? values.findIndex((x, j) => j > negIdx && x >= 0) : -1;
    const borderSx = projected ? { borderTop: "2px solid", borderTopColor: "primary.main", fontSize: "0.9rem" } : {};
    return (
      <TableRow key={label}>
        <TableCell
          sx={{
            ...stickyLeft, top, zIndex: 4, bgcolor: bg, height: SUM_H, fontWeight: 700,
            color: projected ? "primary.light" : undefined, ...borderSx,
          }}
        >
          {projected ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {label}
              <Tooltip title="Soma dos saldos mensais desde o primeiro lancamento. Comeca do zero e os meses futuros sao projecao com base nos lancamentos cadastrados.">
                <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
              </Tooltip>
            </Box>
          ) : (
            label
          )}
        </TableCell>
        {values.map((v, i) => {
          const firstNeg = i === negIdx;
          const recovery = i === recIdx;
          const cellBg = firstNeg ? NEG_BG : recovery ? REC_BG : bg;
          return (
            <TableCell
              key={i}
              align="right"
              sx={{
                position: "sticky", top, zIndex: 3, bgcolor: cellBg, height: SUM_H,
                minWidth: CELL_MIN, whiteSpace: "nowrap", fontWeight: 700,
                color: v < 0 ? DESPESA_COLOR : recovery ? RECEITA_COLOR : projected ? "primary.dark" : color,
                ...borderSx,
              }}
            >
              {firstNeg ? (
                <Tooltip title="Primeiro mes com saldo projetado negativo">
                  <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                    <WarningAmberIcon fontSize="inherit" sx={{ verticalAlign: "-2px", mr: 0.25 }} /> {formatCell(v)}
                  </Box>
                </Tooltip>
              ) : recovery ? (
                <Tooltip title="Saldo projetado volta a positivo">
                  <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                    <TrendingUpIcon fontSize="inherit" sx={{ verticalAlign: "-2px", mr: 0.25 }} /> {formatCell(v)}
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
          ({formatMoney(data.accumulated[firstNegIdx])})
          {recoveryIdx >= 0 ? (
            <>
              {" "}
              ate <strong>{formatMonthShort(months[recoveryIdx])}</strong>{" "}
              ({formatMoney(data.accumulated[recoveryIdx])}).
            </>
          ) : (
            " e nao volta a positivo nesta janela."
          )}
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
                  <TableCell sx={{ ...stickyLeft, zIndex: 5, top: 0, height: HEAD_H }}>Categoria</TableCell>
                  {months.map((m) => (
                    <TableCell key={m} align="right" sx={{ top: 0, height: HEAD_H, minWidth: CELL_MIN, whiteSpace: "nowrap", fontWeight: 600, textTransform: "capitalize", bgcolor: "background.paper" }}>
                      {formatMonthShort(m)}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Totalizadores fixos no topo (empilhados abaixo do header de meses) */}
                {summaryRow("Total receitas", data.totalReceitas, HEAD_H, SUM_BG, RECEITA_COLOR)}
                {summaryRow("Total despesas", data.totalDespesas, HEAD_H + SUM_H, SUM_BG, DESPESA_COLOR)}
                {summaryRow("Saldo do mes", data.saldo, HEAD_H + SUM_H * 2, SUM_BG)}
                {summaryRow("Saldo Projetado", data.accumulated, HEAD_H + SUM_H * 3, PROJ_BG, undefined, true)}
              </TableHead>
              <TableBody>
                {sectionRow("RECEITAS")}
                {categoryRows(data.receitas, RECEITA_COLOR)}

                {sectionRow("DESPESAS")}
                {categoryRows(data.despesas, DESPESA_COLOR)}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : null}
    </Box>
  );
}
