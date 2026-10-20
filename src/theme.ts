import { createTheme } from "@mui/material/styles";
import { ptBR } from "@mui/material/locale";

export const theme = createTheme(
  {
    palette: {
      mode: "light",
      primary: { main: "#1e88e5" },
      success: { main: "#2e7d32" },
      error: { main: "#c62828" },
      background: { default: "#f4f6f8" },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { variant: "contained" },
        styleOverrides: { root: { minHeight: 44, textTransform: "none" } },
      },
      MuiTextField: { defaultProps: { fullWidth: true, size: "medium" } },
    },
  },
  ptBR,
);

export const RECEITA_COLOR = "#2e7d32";
export const DESPESA_COLOR = "#c62828";
// paleta para o grafico de categorias
export const CHART_COLORS = [
  "#1e88e5", "#8e24aa", "#00897b", "#f4511e", "#3949ab",
  "#7cb342", "#fb8c00", "#d81b60", "#00acc1", "#6d4c41",
];
