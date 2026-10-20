import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

interface MonthFieldProps {
  label: string;
  value: string | null; // YYYY-MM
  onChange: (month: string | null) => void;
  minMonth?: string | null;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export function MonthField({ label, value, onChange, minMonth, error, helperText, disabled }: MonthFieldProps) {
  return (
    <DatePicker
      label={label}
      views={["year", "month"]}
      openTo="month"
      format="MMM/YYYY"
      value={value ? dayjs(`${value}-01`) : null}
      minDate={minMonth ? dayjs(`${minMonth}-01`) : undefined}
      disabled={disabled}
      onChange={(d) => onChange(d ? d.format("YYYY-MM") : null)}
      slotProps={{
        textField: { fullWidth: true, error, helperText },
      }}
    />
  );
}
