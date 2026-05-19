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
