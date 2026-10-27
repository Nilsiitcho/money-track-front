import { createTheme } from "@mui/material/styles";
import { ptBR } from "@mui/material/locale";

// Identidade: grafite escuro + laranja fluorescente (marca).
// Verde = receita, vermelho = despesa (semantica de dinheiro, mantidos).
const ORANGE = "#ff6a1a";
const GRAPHITE_BG = "#15181c";
const GRAPHITE_PAPER = "#1f242b";

export const theme = createTheme(
  {
    palette: {
      mode: "dark",
      primary: {
        main: ORANGE,
        light: "#ff8a4c",
        dark: "#e85600",
        contrastText: "#15181c", // texto escuro sobre laranja (laranja e claro)
      },
      secondary: { main: "#9aa1a9" },
      success: { main: "#3fbf6a" },
      error: { main: "#f0575c" },
      warning: { main: "#ffc24b" },
      info: { main: "#5a8dee" },
      background: { default: GRAPHITE_BG, paper: GRAPHITE_PAPER },
      text: { primary: "#e6e8eb", secondary: "#9aa1a9" },
      divider: "rgba(255,255,255,0.08)",
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { variant: "contained" },
        styleOverrides: { root: { minHeight: 44, textTransform: "none", fontWeight: 600 } },
      },
      MuiTextField: { defaultProps: { fullWidth: true, size: "medium" } },
      // Header em grafite (nao laranja), com borda sutil.
      MuiAppBar: {
        defaultProps: { color: "default" },
        styleOverrides: {
          root: {
            backgroundColor: GRAPHITE_PAPER,
            backgroundImage: "none",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    },
  },
  ptBR,
);

export const RECEITA_COLOR = "#3fbf6a";
export const DESPESA_COLOR = "#f0575c";
// Paleta do grafico de categorias (laranja na frente, tons vivos p/ fundo grafite).
export const CHART_COLORS = [
  "#ff6a1a", "#28c0c9", "#a277ff", "#5a8dee", "#3fbf6a",
  "#f0575c", "#ffc24b", "#f06595", "#4ed3b6", "#b0bac5",
];
