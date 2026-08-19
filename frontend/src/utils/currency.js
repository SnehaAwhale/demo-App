export function parseCurrencyDigits(rawValue) {
  const digitsOnly = rawValue.replace(/\D/g, "");
  return digitsOnly === "" ? 0 : Number(digitsOnly);
}

export function formatWholeCurrency(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "";
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatCurrencyWithCents(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Splits a premium into whole-dollar and cents parts for the large
// two-tier-font display (e.g. "$97" + ".03").
export function splitPremiumParts(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return { whole: "$0", cents: ".00" };
  }
  const rounded = Math.round(amount * 100) / 100;
  const [wholePart, centsPart = "00"] = rounded.toFixed(2).split(".");
  return {
    whole: `$${Number(wholePart).toLocaleString("en-US")}`,
    cents: `.${centsPart}`,
  };
}
