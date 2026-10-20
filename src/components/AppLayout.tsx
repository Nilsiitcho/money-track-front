import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AppBar, Toolbar, Typography, IconButton, Box, Container,
  BottomNavigation, BottomNavigationAction, Paper, Fab,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
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
  { label: "Lancamentos", icon: <ReceiptLongIcon />, path: "/entries" },
  { label: "Categorias", icon: <CategoryIcon />, path: "/categories" },
];

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories", false],
    queryFn: () => listCategories(false),
  });

  const currentIndex = NAV.findIndex((n) => n.path === location.pathname);

  return (
    <Box sx={{ pb: 9, minHeight: "100dvh" }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Money Track
          </Typography>
          <IconButton color="inherit" onClick={logout} aria-label="Sair">
            <LogoutIcon />
          </IconButton>
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

      <EntryFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => queryClient.invalidateQueries()}
        categories={categoriesQuery.data ?? []}
        defaultMonth={currentMonth()}
      />
    </Box>
  );
}
