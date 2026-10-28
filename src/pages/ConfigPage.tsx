import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Typography, Alert, Button, Stack,
  RadioGroup, FormControlLabel, Radio, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DownloadIcon from "@mui/icons-material/Download";
import { resetData, exportEntriesCsv } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { currentMonth, shiftMonth } from "../lib/format";
import { MonthField } from "../components/MonthField";
import type { ResetScope } from "../api/types";

const SCOPE_LABEL: Record<ResetScope, string> = {
  ENTRIES: "apenas os lancamentos",
  ENTRIES_AND_CATEGORIES: "os lancamentos e todas as categorias",
};

export function ConfigPage() {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<ResetScope>("ENTRIES");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Exportacao CSV por periodo (padrao: ultimos 12 meses).
  const [fromMonth, setFromMonth] = useState(shiftMonth(currentMonth(), -11));
  const [toMonth, setToMonth] = useState(currentMonth());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const rangeInvalid = fromMonth > toMonth;

  async function doExport() {
    setExportError(null);
    setExporting(true);
    try {
      const blob = await exportEntriesCsv(fromMonth, toMonth);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `money-track_${fromMonth}_a_${toMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(errorMessage(err, "Nao foi possivel exportar."));
    } finally {
      setExporting(false);
    }
  }

  function openConfirm() {
    setPassword("");
    setError(null);
    setSuccess(null);
    setConfirmOpen(true);
  }

  async function doReset() {
    if (!password) {
      setError("Informe a senha.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetData(scope, password);
      await queryClient.invalidateQueries();
      setConfirmOpen(false);
      setSuccess(
        scope === "ENTRIES"
          ? "Lancamentos reiniciados."
          : "Lancamentos e categorias reiniciados.",
      );
    } catch (err) {
      setError(errorMessage(err, "Nao foi possivel reiniciar os dados."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Configuracoes
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <DownloadIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Exportar dados (CSV)
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Baixa os lancamentos do periodo em CSV (uma linha por lancamento de cada
            mes). Bom para analisar em planilha ou colar numa IA.
          </Typography>

          {exportError && <Alert severity="error" sx={{ mb: 2 }}>{exportError}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            <MonthField label="De" value={fromMonth} onChange={(m) => m && setFromMonth(m)} />
            <MonthField
              label="Ate"
              value={toMonth}
              minMonth={fromMonth}
              onChange={(m) => m && setToMonth(m)}
              error={rangeInvalid}
              helperText={rangeInvalid ? "Mes final anterior ao inicial" : undefined}
            />
          </Stack>

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={doExport}
            disabled={exporting || rangeInvalid}
          >
            {exporting ? "Gerando..." : "Baixar CSV"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <WarningAmberIcon color="warning" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Reiniciar dados
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apaga dados de forma permanente. Esta acao nao pode ser desfeita.
          </Typography>

          <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as ResetScope)}>
            <FormControlLabel
              value="ENTRIES"
              control={<Radio />}
              label="Reiniciar apenas lancamentos (mantem categorias)"
            />
            <FormControlLabel
              value="ENTRIES_AND_CATEGORIES"
              control={<Radio />}
              label="Reiniciar lancamentos e categorias (apaga tudo)"
            />
          </RadioGroup>

          <Button
            color="error"
            variant="outlined"
            onClick={openConfirm}
            sx={{ mt: 2 }}
          >
            Reiniciar dados
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => !busy && setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Confirmar reset</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Isso vai apagar <strong>{SCOPE_LABEL[scope]}</strong> de forma permanente.
            Para continuar, informe sua senha.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && doReset()}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setConfirmOpen(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button color="error" onClick={doReset} disabled={busy}>
            {busy ? "Reiniciando..." : "Reiniciar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
