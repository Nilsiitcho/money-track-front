import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { formatMonthLong, shiftMonth } from "../lib/format";

interface Props {
  month: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ month, onChange }: Props) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
      <IconButton onClick={() => onChange(shiftMonth(month, -1))} aria-label="Mes anterior">
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="h6" sx={{ textTransform: "capitalize", fontWeight: 600 }}>
        {formatMonthLong(month)}
      </Typography>
      <IconButton onClick={() => onChange(shiftMonth(month, 1))} aria-label="Proximo mes">
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}
