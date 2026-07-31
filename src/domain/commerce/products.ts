export type ProductKey =
  | "free"
  | "founding_pass"
  | "semester_pass"
  | "exam_sprint";

export interface ProductDefinition {
  key: ProductKey;
  name: string;
  amountMinor: number;
  currency: "aud";
  purchaseType: "free" | "one_time";
  publicFlag:
    | null
    | "semester_pass_enabled"
    | "exam_sprint_enabled";
}

export const PRODUCT_CATALOG: Record<ProductKey, ProductDefinition> = {
  free: {
    key: "free",
    name: "Free",
    amountMinor: 0,
    currency: "aud",
    purchaseType: "free",
    publicFlag: null,
  },
  founding_pass: {
    key: "founding_pass",
    name: "Spring 2026 Founding Pass",
    amountMinor: 1_900,
    currency: "aud",
    purchaseType: "one_time",
    publicFlag: null,
  },
  semester_pass: {
    key: "semester_pass",
    name: "Semester Pass",
    amountMinor: 3_990,
    currency: "aud",
    purchaseType: "one_time",
    publicFlag: "semester_pass_enabled",
  },
  exam_sprint: {
    key: "exam_sprint",
    name: "Exam Sprint",
    amountMinor: 1_190,
    currency: "aud",
    purchaseType: "one_time",
    publicFlag: "exam_sprint_enabled",
  },
};

export function productDefinition(key: string): ProductDefinition | null {
  return key in PRODUCT_CATALOG
    ? PRODUCT_CATALOG[key as ProductKey]
    : null;
}

export function productAccessEnd(
  productKey: ProductKey,
  input: {
    now: Date;
    foundingPassEndAt: string;
    activeSemesterEndDate?: string | null;
  },
): Date | null {
  if (productKey === "free") return null;
  if (productKey === "exam_sprint") {
    return new Date(input.now.getTime() + 14 * 86_400_000);
  }
  if (productKey === "founding_pass") {
    const end = new Date(input.foundingPassEndAt);
    return Number.isNaN(end.getTime()) ? null : end;
  }
  if (input.activeSemesterEndDate) {
    const end = new Date(`${input.activeSemesterEndDate}T23:59:59+11:00`);
    if (!Number.isNaN(end.getTime())) return end;
  }
  return new Date(input.now.getTime() + 180 * 86_400_000);
}

export function priceIdEnvironmentKey(productKey: ProductKey): string | null {
  if (productKey === "founding_pass") {
    return "STRIPE_FOUNDING_PASS_PRICE_ID";
  }
  if (productKey === "semester_pass") {
    return "STRIPE_SEMESTER_PASS_PRICE_ID";
  }
  if (productKey === "exam_sprint") {
    return "STRIPE_EXAM_SPRINT_PRICE_ID";
  }
  return null;
}
