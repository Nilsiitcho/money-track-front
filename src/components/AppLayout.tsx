import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../auth/AuthContext";
import { listCategories } from "../api/endpoints";
import { EntryFormDialog } from "./EntryFormDialog";
import { currentMonth } from "../lib/format";

const NAV = [
  { label: "Painel", icon: <DashboardIcon />, path: "/" },
  { label: "Tabela", icon: <TableChartIcon />, path: "/report" },
  { label: "Lancamentos", icon: <ReceiptLongIcon />, path: "/entries" },
  { label: "Categorias", icon: <CategoryIcon />, path: "/categories" },
];

const DRAWER_WIDTH = 240;

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [addOpen, setAddOpen] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories", false],
    queryFn: () => listCategories(false),
  });

  const dialog = (
    <EntryFormDialog
      open={addOpen}
      onClose={() => setAddOpen(false)}
      onSaved={() => queryClient.invalidateQueries()}
      categories={categoriesQuery.data ?? []}
      defaultMonth={currentMonth()}
    />
  );

  const logoutButton = (
    <IconButton color="inherit" onClick={logout} aria-label="Sair">
      <LogoutIcon />
    </IconButton>
  );

  // ---------- Mobile: bottom nav + FAB ----------
  if (!isDesktop) {
    const currentIndex = NAV.findIndex((n) => n.path === location.pathname);
    return (
      <Box sx={{ pb: 9, minHeight: "100dvh" }}>
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

        <Fab
          color="primary"
          aria-label="Novo lancamento"
          onClick={() => setAddOpen(true)}
          sx={{ position: "fixed", bottom: 72, right: 16, zIndex: (t) => t.zIndex.appBar + 1 }}
        >
          <AddIcon />
        </Fab>

        <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10 }} elevation={3}>
          <BottomNavigation
            showLabels
            value={currentIndex === -1 ? 0 : currentIndex}
            onChange={(_, idx) => navigate(NAV[idx].path)}
          >
            {NAV.map((n) => (
              <BottomNavigationAction key={n.path} label={n.label} icon={n.icon} />
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
          <Button fullWidth startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Novo lancamento
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
