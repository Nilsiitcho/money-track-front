import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, IconButton, Box, Container,
  BottomNavigation, BottomNavigationAction, Paper, Fab,
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Button,
  useMediaQuery, useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TableChartIcon from "@mui/icons-material/TableChart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CategoryIcon from "@mui/icons-material/Category";
import SavingsIcon from "@mui/icons-material/Savings";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../auth/AuthContext";
import { QuickEntryDialog } from "./QuickEntryDialog";

const NAV = [
  { label: "Painel", icon: <DashboardIcon />, path: "/" },
  { label: "Tabela", icon: <TableChartIcon />, path: "/report" },
  { label: "Reserva", icon: <SavingsIcon />, path: "/reserva" },
  { label: "Lancamentos", icon: <ReceiptLongIcon />, path: "/entries" },
  { label: "Categorias", icon: <CategoryIcon />, path: "/categories" },
  { label: "Config", icon: <SettingsIcon />, path: "/config" },
];

// Mobile foca em lancar gasto rapido (FAB) + ver Painel e Lancamentos.
// Gestao (Tabela, Reserva, Categorias, Config) fica no desktop.
const MOBILE_NAV = [
  { label: "Painel", icon: <DashboardIcon />, path: "/" },
  { label: "Lancamentos", icon: <ReceiptLongIcon />, path: "/entries" },
];

const DRAWER_WIDTH = 240;

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [addOpen, setAddOpen] = useState(false);

  const dialog = <QuickEntryDialog open={addOpen} onClose={() => setAddOpen(false)} />;

  const logoutButton = (
    <IconButton color="inherit" onClick={logout} aria-label="Sair">
      <LogoutIcon />
    </IconButton>
  );

  // ---------- Mobile: gasto rapido (FAB central) + Painel/Lancamentos ----------
  if (!isDesktop) {
    const currentIndex = MOBILE_NAV.findIndex((n) => n.path === location.pathname);
    return (
      <Box sx={{ pb: "calc(72px + env(safe-area-inset-bottom))", minHeight: "100dvh" }}>
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Money Track
            </Typography>
            {logoutButton}
          </Toolbar>
        </AppBar>

        <Container maxWidth="sm" sx={{ py: 2 }}>
          <Outlet />
        </Container>

        {/* Acao principal no mobile: lancar gasto rapido */}
        <Fab
          color="primary"
          variant="extended"
          aria-label="Lancar gasto rapido"
          onClick={() => setAddOpen(true)}
          sx={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "calc(env(safe-area-inset-bottom) + 18px)",
            zIndex: (t) => t.zIndex.appBar + 2,
            px: 3,
            boxShadow: 6,
          }}
        >
          <AddIcon sx={{ mr: 1 }} />
          Lancar
        </Fab>

        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            pb: "env(safe-area-inset-bottom)",
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={currentIndex === -1 ? false : currentIndex}
            onChange={(_, idx) => navigate(MOBILE_NAV[idx].path)}
            // Itens nas pontas; centro livre para o FAB "Lancar".
            sx={{ justifyContent: "space-between", px: 3 }}
          >
            {MOBILE_NAV.map((n) => (
              <BottomNavigationAction
                key={n.path}
                label={n.label}
                icon={n.icon}
                sx={{ maxWidth: 120, flexGrow: 0 }}
              />
            ))}
          </BottomNavigation>
        </Paper>

        {dialog}
      </Box>
    );
  }

  // ---------- Desktop: sidebar lateral ----------
  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <AppBar position="fixed" elevation={1} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Money Track
          </Typography>
          {logoutButton}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Gasto rapido
          </Button>
        </Box>
        <List>
          {NAV.map((n) => (
            <ListItemButton
              key={n.path}
              selected={location.pathname === n.path}
              onClick={() => navigate(n.path)}
            >
              <ListItemIcon>{n.icon}</ListItemIcon>
              <ListItemText primary={n.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, width: `calc(100% - ${DRAWER_WIDTH}px)` }}>
        <Toolbar />
        {/* Tabela usa largura total (acompanha ultrawide); demais paginas ficam em lg */}
        <Container maxWidth={location.pathname === "/report" ? false : "lg"} sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>

      {dialog}
    </Box>
  );
}
