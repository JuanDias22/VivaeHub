// Sync layer between the in-memory `store` (synchronous API used by all UI
// components) and Supabase. Strategy:
//  - On login/signup we call `hydrateFromSupabase` to populate the store
//    with the user's clinic data.
//  - Mutations stay synchronous in the UI but fire-and-forget a Supabase
//    write through the helpers below. IDs are generated client-side
//    (crypto.randomUUID) and reused on the server so we never have to
//    reconcile.
import { supabase } from "@/integrations/supabase/client";
import {
  store,
  type Patient,
  type Professional,
  type Appointment,
  type ScheduleBlock,
  type FinanceEntry,
  type AnamnesisField,
  type AreaAnamnesis,
  type PatientNote,
  type ContributionEntry,
} from "./mock-store";

let currentUserId: string | null = null;
let currentClinicId: string | null = null;

export function getClinicId() {
  return currentClinicId;
}
export function getUserId() {
  return currentUserId;
}

function logErr(label: string, err: unknown) {
  if (err) console.warn(`[supabase-sync] ${label}`, err);
}

/** Loads the entire clinic dataset from Supabase into the store. */
export async function hydrateFromSupabase(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return false;
  currentUserId = user.id;

  // Wait briefly for the on_auth_user_created trigger to provision data
  // (clinic, profile, areas, professionals) on first signup.
  let profile: { clinic_id: string } | null = null;
  for (let i = 0; i < 8; i++) {
    const { data } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.clinic_id) {
      profile = data;
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!profile) return false;
  currentClinicId = profile.clinic_id;

  const [clinicRes, areasRes, prosRes, patientsRes, apptsRes, blocksRes, notesRes, anamnesesRes, examsRes, contribsRes, financeRes] =
    await Promise.all([
      supabase.from("clinics").select("*").eq("id", profile.clinic_id).maybeSingle(),
      supabase.from("areas").select("*").eq("clinic_id", profile.clinic_id),
      supabase.from("professionals").select("*").eq("clinic_id", profile.clinic_id),
      supabase.from("patients").select("*").eq("clinic_id", profile.clinic_id),
      supabase.from("appointments").select("*").eq("clinic_id", profile.clinic_id),
      supabase.from("schedule_blocks").select("*").eq("clinic_id", profile.clinic_id),
      supabase.from("patient_notes").select("*").eq("clinic_id", profile.clinic_id),
      supabase.from("patient_anamneses").select("*").eq("clinic_id", profile.clinic_id),
      supabase.from("patient_exams").select("*").eq("clinic_id", profile.clinic_id),
      supabase.from("contributions").select("*").eq("clinic_id", profile.clinic_id),
      supabase.from("finance_entries").select("*").eq("clinic_id", profile.clinic_id),
    ]);

  if (clinicRes.data) {
    store.clinic = {
      name: clinicRes.data.name,
      ownerEmail: clinicRes.data.owner_email,
      slug: clinicRes.data.slug,
      logoUrl: clinicRes.data.logo_url ?? undefined,
    };
  }

  store.areas = (areasRes.data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    color: a.color,
    key: a.key,
  }));

  store.professionals = (prosRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty ?? "",
    areaId: p.area_id ?? "",
    color: p.color,
    slug: p.slug,
    anamnesisTemplate: (p.anamnesis_template as { fields: AnamnesisField[]; updatedAt: string } | null) ?? undefined,
  }));

  const patientNotes = new Map<string, PatientNote[]>();
  for (const n of notesRes.data ?? []) {
    const arr = patientNotes.get(n.patient_id) ?? [];
    arr.push({
      id: n.id,
      date: n.date,
      professionalId: n.professional_id,
      areaId: n.area_id ?? "",
      content: n.content,
    });
    patientNotes.set(n.patient_id, arr);
  }
  const patientAnam = new Map<string, AreaAnamnesis[]>();
  for (const a of anamnesesRes.data ?? []) {
    const arr = patientAnam.get(a.patient_id) ?? [];
    arr.push({
      areaId: a.area_id ?? "",
      professionalId: a.professional_id,
      filledAt: a.filled_at,
      answers: (a.answers as Record<string, string | string[] | boolean>) ?? {},
    });
    patientAnam.set(a.patient_id, arr);
  }
  const patientExams = new Map<string, { id: string; name: string; sizeKb: number; uploadedAt: string }[]>();
  for (const e of examsRes.data ?? []) {
    const arr = patientExams.get(e.patient_id) ?? [];
    arr.push({ id: e.id, name: e.name, sizeKb: e.size_kb ?? 0, uploadedAt: e.uploaded_at });
    patientExams.set(e.patient_id, arr);
  }
  const patientContribs = new Map<string, ContributionEntry[]>();
  for (const c of contribsRes.data ?? []) {
    const arr = patientContribs.get(c.patient_id) ?? [];
    arr.push({ id: c.id, date: c.date, amount: Number(c.amount) });
    patientContribs.set(c.patient_id, arr);
  }

  store.patients = (patientsRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone ?? "",
    birthDate: p.birth_date ?? "",
    email: p.email ?? undefined,
    professionalId: p.professional_id ?? undefined,
    isContributor: p.is_contributor,
    contributionAmount: p.contribution_amount != null ? Number(p.contribution_amount) : undefined,
    lgptConsent: p.lgpt_consent,
    personal: (p.personal as Patient["personal"]) ?? undefined,
    health: (p.health as Patient["health"]) ?? undefined,
    notes: (patientNotes.get(p.id) ?? []).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    areaAnamneses: patientAnam.get(p.id) ?? [],
    exams: patientExams.get(p.id) ?? [],
    contributions: (patientContribs.get(p.id) ?? []).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
  }));

  store.appointments = (apptsRes.data ?? []).map((a) => ({
    id: a.id,
    patientId: a.patient_id,
    professionalId: a.professional_id,
    date: a.date,
    durationMin: a.duration_min,
    status: a.status as Appointment["status"],
    modality: (a.modality as Appointment["modality"]) ?? undefined,
    notes: a.notes ?? undefined,
  }));

  store.scheduleBlocks = (blocksRes.data ?? []).map((b) => ({
    id: b.id,
    professionalId: b.professional_id,
    kind: b.kind as ScheduleBlock["kind"],
    start: b.start_at,
    end: b.end_at,
    reason: b.reason ?? undefined,
  }));

  store.finance = (financeRes.data ?? []).map((f) => ({
    id: f.id,
    date: f.date,
    description: f.description,
    type: f.type as FinanceEntry["type"],
    amount: Number(f.amount),
  }));

  store.authed = true;
  store.activeProfessionalId = store.professionals[0]?.id ?? null;
  store.notify();
  return true;
}

export function clearSyncSession() {
  currentUserId = null;
  currentClinicId = null;
}

/* ============== write-through helpers ============== */

function clinic(): string | null {
  return currentClinicId;
}

export function syncInsertPatient(p: Patient) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("patients")
    .insert({
      id: p.id,
      clinic_id: cid,
      name: p.name,
      phone: p.phone,
      birth_date: p.birthDate || null,
      email: p.email ?? null,
      professional_id: p.professionalId ?? null,
      is_contributor: p.isContributor,
      contribution_amount: p.contributionAmount ?? null,
      lgpt_consent: !!p.lgptConsent,
      personal: (p.personal as never) ?? null,
      health: (p.health as never) ?? null,
    })
    .then(({ error }) => logErr("insert patient", error));
}

export function syncUpdatePatient(id: string, patch: Partial<Patient>) {
  const cid = clinic();
  if (!cid) return;
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.birthDate !== undefined) row.birth_date = patch.birthDate || null;
  if (patch.email !== undefined) row.email = patch.email ?? null;
  if (patch.professionalId !== undefined) row.professional_id = patch.professionalId ?? null;
  if (patch.isContributor !== undefined) row.is_contributor = patch.isContributor;
  if (patch.contributionAmount !== undefined) row.contribution_amount = patch.contributionAmount ?? null;
  if (patch.lgptConsent !== undefined) row.lgpt_consent = patch.lgptConsent;
  if (patch.personal !== undefined) row.personal = patch.personal as never;
  if (patch.health !== undefined) row.health = patch.health as never;
  if (Object.keys(row).length === 0) return;
  void supabase
    .from("patients")
    .update(row as never)
    .eq("id", id)
    .then(({ error }) => logErr("update patient", error));
}

export function syncInsertNote(patientId: string, n: PatientNote) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("patient_notes")
    .insert({
      id: n.id,
      clinic_id: cid,
      patient_id: patientId,
      professional_id: n.professionalId,
      area_id: n.areaId || null,
      date: n.date.slice(0, 10),
      content: n.content,
    })
    .then(({ error }) => logErr("insert note", error));
}

export function syncUpsertAnamnesis(patientId: string, a: AreaAnamnesis) {
  const cid = clinic();
  if (!cid) return;
  // Replace by (patient, area)
  void supabase
    .from("patient_anamneses")
    .delete()
    .eq("patient_id", patientId)
    .eq("area_id", a.areaId)
    .then(() =>
      supabase
        .from("patient_anamneses")
        .insert({
          clinic_id: cid,
          patient_id: patientId,
          professional_id: a.professionalId,
          area_id: a.areaId,
          filled_at: a.filledAt,
          answers: a.answers as never,
        })
        .then(({ error }) => logErr("upsert anamnesis", error)),
    );
}

export function syncInsertExam(patientId: string, e: { id: string; name: string; sizeKb: number; uploadedAt: string }) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("patient_exams")
    .insert({
      id: e.id,
      clinic_id: cid,
      patient_id: patientId,
      name: e.name,
      size_kb: e.sizeKb,
      uploaded_at: e.uploadedAt,
    })
    .then(({ error }) => logErr("insert exam", error));
}

export function syncInsertContribution(patientId: string, c: ContributionEntry) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("contributions")
    .insert({
      id: c.id,
      clinic_id: cid,
      patient_id: patientId,
      amount: c.amount,
      date: c.date,
    })
    .then(({ error }) => logErr("insert contribution", error));
}

export function syncMarkContributor(patientId: string, amount: number | null) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("patients")
    .update({ is_contributor: amount != null, contribution_amount: amount })
    .eq("id", patientId)
    .then(({ error }) => logErr("mark contributor", error));
}

export function syncInsertProfessional(p: Professional) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("professionals")
    .insert({
      id: p.id,
      clinic_id: cid,
      area_id: p.areaId || null,
      name: p.name,
      specialty: p.specialty,
      slug: p.slug,
      color: p.color,
      anamnesis_template: (p.anamnesisTemplate as never) ?? null,
    })
    .then(({ error }) => logErr("insert professional", error));
}

export function syncUpdateProfessional(id: string, patch: Partial<Professional>) {
  const cid = clinic();
  if (!cid) return;
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.specialty !== undefined) row.specialty = patch.specialty;
  if (patch.areaId !== undefined) row.area_id = patch.areaId || null;
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.color !== undefined) row.color = patch.color;
  if (patch.anamnesisTemplate !== undefined) row.anamnesis_template = patch.anamnesisTemplate as never;
  if (Object.keys(row).length === 0) return;
  void supabase
    .from("professionals")
    .update(row)
    .eq("id", id)
    .then(({ error }) => logErr("update professional", error));
}

export function syncInsertArea(a: { id: string; name: string; key: string; color: string }) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("areas")
    .insert({ id: a.id, clinic_id: cid, name: a.name, key: a.key, color: a.color })
    .then(({ error }) => logErr("insert area", error));
}
export function syncDeleteArea(id: string) {
  void supabase.from("areas").delete().eq("id", id).then(({ error }) => logErr("delete area", error));
}

export function syncInsertAppointment(a: Appointment) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("appointments")
    .insert({
      id: a.id,
      clinic_id: cid,
      patient_id: a.patientId,
      professional_id: a.professionalId,
      date: a.date,
      duration_min: a.durationMin,
      status: a.status,
      modality: a.modality ?? null,
      notes: a.notes ?? null,
    })
    .then(({ error }) => logErr("insert appointment", error));
}
export function syncUpdateAppointment(id: string, patch: Partial<Appointment>) {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.durationMin !== undefined) row.duration_min = patch.durationMin;
  if (patch.modality !== undefined) row.modality = patch.modality;
  if (Object.keys(row).length === 0) return;
  void supabase
    .from("appointments")
    .update(row)
    .eq("id", id)
    .then(({ error }) => logErr("update appointment", error));
}

export function syncInsertBlock(b: ScheduleBlock) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("schedule_blocks")
    .insert({
      id: b.id,
      clinic_id: cid,
      professional_id: b.professionalId,
      kind: b.kind,
      start_at: b.start,
      end_at: b.end,
      reason: b.reason ?? null,
    })
    .then(({ error }) => logErr("insert block", error));
}
export function syncDeleteBlock(id: string) {
  void supabase.from("schedule_blocks").delete().eq("id", id).then(({ error }) => logErr("delete block", error));
}

export function syncInsertFinance(f: FinanceEntry) {
  const cid = clinic();
  if (!cid) return;
  void supabase
    .from("finance_entries")
    .insert({
      id: f.id,
      clinic_id: cid,
      amount: f.amount,
      type: f.type,
      description: f.description,
      date: f.date,
    })
    .then(({ error }) => logErr("insert finance", error));
}

export function syncUpdateClinic(patch: Partial<{ name: string; slug: string; logoUrl: string | null }>) {
  const cid = clinic();
  if (!cid) return;
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl;
  if (Object.keys(row).length === 0) return;
  void supabase.from("clinics").update(row).eq("id", cid).then(({ error }) => logErr("update clinic", error));
}