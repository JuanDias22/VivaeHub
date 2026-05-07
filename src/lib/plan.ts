import type { Clinic } from "./mock-store";

export type PlanId = "trial" | "basic" | "plus" | "pro";

export const PLAN_LABELS: Record<PlanId, string> = {
  trial: "Trial",
  basic: "Basic",
  plus: "Plus",
  pro: "Pro",
};

export type PlanResource = "professionals";

// Infinity = ilimitado
export const PLAN_LIMITS: Record<PlanResource, Record<PlanId, number>> = {
  professionals: {
    trial: 5,
    basic: 5,
    plus: 10,
    pro: Infinity,
  },
};

export function getPlanLimit(
  clinic: Clinic | undefined | null,
  resource: PlanResource,
): number {
  const plan = (clinic?.plan ?? "trial") as PlanId;
  return PLAN_LIMITS[resource][plan] ?? 0;
}

export function formatLimit(n: number): string {
  return n === Infinity ? "∞" : String(n);
}

export function isPlanActive(clinic: Clinic | undefined | null): boolean {
  if (!clinic) return false;
  const plan = clinic.plan ?? "trial";
  if (plan === "basic" || plan === "pro") return true;
  if (plan === "trial") {
    if (!clinic.trialEndsAt) return false;
    return new Date(clinic.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

export function trialDaysLeft(clinic: Clinic | undefined | null): number {
  if (!clinic?.trialEndsAt) return 0;
  const ms = new Date(clinic.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}