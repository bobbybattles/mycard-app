// Schema for the Rates card.
// Creator adds rate items one at a time. Each item has a title (the service),
// an optional description, and a free-text amount field (so they can type
// things like "$75" or "$75 | Discount for 3+ items").

export type RateItem = {
  id: string;
  title: string;
  description?: string;
  amount: string;
};

export type RatesCardData = {
  items: RateItem[];
};

export function hasAnyRate(data: RatesCardData | undefined | null): boolean {
  if (!data?.items) return false;
  return data.items.some(
    (it) => (it.title && it.title.trim().length > 0) || (it.amount && it.amount.trim().length > 0)
  );
}

/**
 * Pretty-print a rate amount for the public kit.
 * Bare numbers ("75", "75.5") get formatted as currency ("$75", "$75.50").
 * Anything else (already-prefixed values, "Free", "DM me", etc.) passes through.
 */
export function formatRateAmount(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const isBareNumber = /^-?\d+(\.\d+)?$/.test(trimmed);
  if (!isBareNumber) return trimmed;

  const num = parseFloat(trimmed);
  if (!Number.isFinite(num)) return trimmed;

  const decimals = trimmed.includes(".") ? trimmed.split(".")[1].length : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Math.min(decimals, 2),
    maximumFractionDigits: 2,
  }).format(num);
}
