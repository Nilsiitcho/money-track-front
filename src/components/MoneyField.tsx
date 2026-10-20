import { forwardRef } from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { TextField } from "@mui/material";

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

// Adapter NumericFormat -> input do MUI
const NumericAdapter = forwardRef<HTMLInputElement, CustomProps>(function NumericAdapter(props, ref) {
  const { onChange, ...other } = props;
  return (
    <NumericFormat
      {...(other as NumericFormatProps)}
      getInputRef={ref}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      valueIsNumericString
      prefix="R$ "
      onValueChange={(values) => {
        onChange({ target: { name: props.name, value: values.value } });
      }}
    />
  );
});

interface MoneyFieldProps {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  error?: boolean;
  helperText?: string;
  name?: string;
}

export function MoneyField({ label, value, onChange, error, helperText, name = "amount" }: MoneyFieldProps) {
  return (
    <TextField
      label={label}
      value={value === 0 || value === "0" ? "" : String(value)}
      name={name}
      error={error}
      helperText={helperText}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      InputProps={{ inputComponent: NumericAdapter as never }}
      inputProps={{ inputMode: "decimal" }}
    />
  );
}
