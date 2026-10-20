import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatMoney(value: number): string {
  return currency.format(value ?? 0);
}

/** "2026-03" -> "mar/2026" */
export function formatMonthLabel(month: string): string {
  return dayjs(`${month}-01`).format("MMM/YYYY");
}

/** "2026-03" -> "março de 2026" */
export function formatMonthLong(month: string): string {
  return dayjs(`${month}-01`).format("MMMM [de] YYYY");
}

export function currentMonth(): string {
  return dayjs().format("YYYY-MM");
}

export function shiftMonth(month: string, delta: number): string {
  return dayjs(`${month}-01`).add(delta, "month").format("YYYY-MM");
}
