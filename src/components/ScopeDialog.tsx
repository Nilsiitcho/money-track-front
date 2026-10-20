import { useState } from "react";
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button,
  FormControl, FormControlLabel, Radio, RadioGroup,
} from "@mui/material";
import type { EditScope } from "../api/types";

interface ScopeDialogProps {
  open: boolean;
  title: string;
  action: "edit" | "delete";
  onConfirm: (scope: EditScope) => void;
  onClose: () => void;
}

export function ScopeDialog({ open, title, action, onConfirm, onClose }: ScopeDialogProps) {
  const [scope, setScope] = useState<EditScope>("ONLY_THIS");
  const verb = action === "edit" ? "Alterar" : "Excluir";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <FormControl>
          <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as EditScope)}>
            <FormControlLabel value="ONLY_THIS" control={<Radio />} label="Somente este mes" />
            <FormControlLabel value="THIS_AND_FUTURE" control={<Radio />} label="Este mes e os seguintes" />
            <FormControlLabel value="ALL" control={<Radio />} label="Todos os meses" />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancelar
        </Button>
        <Button color={action === "delete" ? "error" : "primary"} onClick={() => onConfirm(scope)}>
          {verb}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
