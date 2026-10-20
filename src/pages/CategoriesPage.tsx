import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Stack, TextField, Button, List, ListItem, ListItemText,
  IconButton, Chip, FormControlLabel, Switch, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteIcon from "@mui/icons-material/Delete";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  listCategories, createCategory, renameCategory, archiveCategory, deleteCategory,
} from "../api/endpoints";
import { errorMessage } from "../api/client";
import type { Category } from "../api/types";

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["categories", includeArchived],
    queryFn: () => listCategories(includeArchived),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  async function run(fn: () => Promise<unknown>, fallback: string) {
    setError(null);
    try {
      await fn();
      await refresh();
      return true;
    } catch (err) {
      setError(errorMessage(err, fallback));
      return false;
    }
  }

  async function add() {
    if (!newName.trim()) return;
    const ok = await run(() => createCategory(newName.trim()), "Nao foi possivel criar");
    if (ok) setNewName("");
  }

  async function saveRename() {
    if (!editing) return;
    const ok = await run(() => renameCategory(editing.id, editName.trim()), "Nao foi possivel renomear");
    if (ok) setEditing(null);
  }

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Nova categoria
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              placeholder="Ex.: Transporte"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              size="small"
            />
            <Button onClick={add} sx={{ whiteSpace: "nowrap" }}>
              Adicionar
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <FormControlLabel
        control={<Switch checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />}
        label="Mostrar arquivadas"
      />

      <Card sx={{ mt: 1 }}>
        {isLoading ? (
          <CardContent>Carregando...</CardContent>
        ) : data && data.length > 0 ? (
          <List disablePadding>
            {data.map((c, i) => (
              <Box key={c.id}>
                {i > 0 && <Divider component="li" />}
                <ListItem
                  secondaryAction={
                    <Stack direction="row">
                      <IconButton
                        aria-label="Renomear"
                        onClick={() => {
                          setEditing(c);
                          setEditName(c.name);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      {!c.archived && (
                        <IconButton
                          aria-label="Arquivar"
                          onClick={() => run(() => archiveCategory(c.id), "Nao foi possivel arquivar")}
                        >
                          <ArchiveIcon />
                        </IconButton>
                      )}
                      <IconButton aria-label="Excluir" onClick={() => setConfirmDelete(c)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={c.name}
                    secondary={c.archived ? <Chip size="small" label="Arquivada" /> : null}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        ) : (
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Nenhuma categoria.
            </Typography>
          </CardContent>
        )}
      </Card>

      {/* Renomear */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>Renomear categoria</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
          <Button onClick={saveRename}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Excluir */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir categoria"
        message={`Excluir "${confirmDelete?.name}"? Se estiver em uso, arquive-a em vez de excluir.`}
        confirmLabel="Excluir"
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          const c = confirmDelete;
          setConfirmDelete(null);
          if (c) void run(() => deleteCategory(c.id), "Nao foi possivel excluir");
        }}
      />
    </Box>
  );
}
