import type { Clinic } from "./mock-store";

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