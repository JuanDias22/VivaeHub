// In-memory mock store for the VivaeHub SaaS demo.
// Multi-tenant: each "session" works inside a single clinic/association.
// Modelo: todo paciente é associado automaticamente; contribuição é fixa de R$50/mês.

import { addDays, addHours, format, startOfDay } from "date-fns";

export type Area = {
  id: string;
  name: string;
  color: string;
  /** Slug usado para identificar prontuário por área (nutricao, enfermagem...). */
  key: string;
};

export type AnamnesisField = {
  id: string;
  type: "texto" | "textarea" | "checkbox" | "sim_nao" | "multipla";
  label: string;
  /** Para tipo "multipla": opções disponíveis. */
  options?: string[];
  required?: boolean;
};

export type AnamnesisTemplate = {
  /** Conjunto de campos que o profissional definiu para sua anamnese. */
  fields: AnamnesisField[];
  updatedAt: string;
};

export type Professional = {
  id: string;
  name: string;
  specialty: string;
  areaId: string;
  color: string;
  slug: string;
  /** Modelo de anamnese personalizado deste profissional. */
  anamnesisTemplate?: AnamnesisTemplate;
};

/** Resposta de uma anamnese específica, por área, preenchida para o paciente. */
export type AreaAnamnesis = {
  areaId: string;
  professionalId: string;
  filledAt: string;
  /** Map fieldId -> valor (string ou string[] para múltipla/checkbox-array). */
  answers: Record<string, string | string[] | boolean>;
};

export type ExamFile = {
  id: string;
  name: string;
  sizeKb: number;
  uploadedAt: string;
};

export type ContributionEntry = {
  id: string;
  date: string;
  amount: number;
};

/** Cadastro APAD — dados pessoais completos. */
export type PatientPersonal = {
  rg?: string;
  cpf?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  profession?: string;
  /** Telefone fixo. */
  landline?: string;
};

/** Dados clínicos APAD que alimentam o Prontuário Clínico. */
export type PatientHealth = {
  howKnewAssociation?: string;
  diagnosisYear?: string;
  diabetesType?: "tipo1" | "tipo2" | "gestacional" | "lada" | "mody" | "outro";
  medications?: string;
  conditions: {
    insulina: boolean;
    aparelhoGlicemia: boolean;
    bombaInsulina: boolean;
    hipertensao: boolean;
    cardiopatia: boolean;
    retinopatia: boolean;
    neuropatia: boolean;
    nefropatia: boolean;
    colesterol: boolean;
    fumante: boolean;
  };
};

export type Patient = {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  email?: string;
  personal?: PatientPersonal;
  health?: PatientHealth;
  /** Profissional responsável principal pelo paciente. */
  professionalId?: string;
  /** Se o paciente optou por contribuir voluntariamente (R$50 fixos). */
  isContributor: boolean;
  contributionAmount?: number;
  contributions: ContributionEntry[];
  /** Aceite LGPD (obrigatório no cadastro). */
  lgptConsent?: boolean;
  /** Anotações por área. */
  notes: PatientNote[];
  /** Anamneses preenchidas, indexadas por areaId. */
  areaAnamneses: AreaAnamnesis[];
  exams: ExamFile[];
};

export type PatientNote = {
  id: string;
  date: string;
  professionalId: string;
  /** Área do prontuário a que esta anotação pertence. */
  areaId: string;
  content: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  professionalId: string;
  date: string; // ISO
  durationMin: number;
  status: "confirmado" | "pendente" | "cancelado";
  modality?: "presencial" | "online";
  notes?: string;
};

/** Bloqueio de agenda — slot, dia inteiro ou intervalo (férias). */
export type ScheduleBlock = {
  id: string;
  professionalId: string;
  /** Tipo de bloqueio. */
  kind: "slot" | "day" | "range";
  /** ISO start (para slot é o slot; para day é 00:00; para range é o início). */
  start: string;
  /** ISO end (slot: start + duração; day: 23:59; range: fim do último dia). */
  end: string;
  reason?: string;
};

export type FinanceEntry = {
  id: string;
  date: string;
  description: string;
  type: "contribuicao" | "consulta" | "outro";
  amount: number;
};

export type WhatsAppLog = {
  id: string;
  to: string;
  message: string;
  sentAt: string;
  kind: "confirmacao" | "lembrete" | "anamnese";
};

export type ReceptionStatus = "aguardando" | "em_atendimento" | "finalizado";

export type ReceptionEntry = {
  id: string;
  appointmentId: string;
  arrivedAt: string;
  status: ReceptionStatus;
  startedAt?: string;
  finishedAt?: string;
};

export type Clinic = {
  name: string;
  ownerEmail: string;
  slug: string;
  logoUrl?: string;
};

type Listener = () => void;

/** Contribuição mensal fixa da APAD. */
export const CONTRIBUTION_AMOUNT = 50;
/** Texto oficial APAD para o checkbox de contribuição. */
export const CONTRIBUTION_TEXT =
  "Desejo, de forma voluntária, ser sócio contribuinte da APAD - Associação Paranaense do Diabético Juvenil, com o valor mensal de R$50,00.";
/** Texto oficial LGPD. */
export const LGPD_TEXT =
  "Autorizo o uso dos meus dados para atendimento e estudos conforme legislação vigente.";
/** Backwards-compat: outros módulos importavam MIN_CONTRIBUTION. */
export const MIN_CONTRIBUTION = CONTRIBUTION_AMOUNT;

const PALETTE = [
  "oklch(0.62 0.16 250)",
  "oklch(0.65 0.14 220)",
  "oklch(0.6 0.15 200)",
  "oklch(0.58 0.13 190)",
  "oklch(0.66 0.15 155)",
  "oklch(0.6 0.18 285)",
];

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

const EMPTY_CONDITIONS: PatientHealth["conditions"] = {
  insulina: false,
  aparelhoGlicemia: false,
  bombaInsulina: false,
  hipertensao: false,
  cardiopatia: false,
  retinopatia: false,
  neuropatia: false,
  nefropatia: false,
  colesterol: false,
  fumante: false,
};

export const CONDITION_LABEL: Record<keyof PatientHealth["conditions"], string> = {
  insulina: "Uso de insulina",
  aparelhoGlicemia: "Aparelho de glicemia",
  bombaInsulina: "Bomba de insulina",
  hipertensao: "Hipertensão",
  cardiopatia: "Cardiopatia",
  retinopatia: "Retinopatia",
  neuropatia: "Neuropatia",
  nefropatia: "Nefropatia",
  colesterol: "Colesterol",
  fumante: "Fumante",
};

/** Modelos de anamnese sugeridos por área (servem de ponto de partida). */
function defaultTemplate(areaKey: string): AnamnesisTemplate {
  const now = new Date().toISOString();
  if (areaKey === "nutricao") {
    return {
      updatedAt: now,
      fields: [
        { id: "n1", type: "textarea", label: "Hábitos alimentares (refeições, beliscos)", required: false },
        { id: "n2", type: "multipla", label: "Objetivo principal", options: ["Emagrecimento", "Ganho de massa", "Reeducação alimentar", "Saúde geral"] },
        { id: "n3", type: "sim_nao", label: "Possui restrição/intolerância alimentar?" },
        { id: "n4", type: "texto", label: "Quais restrições?" },
      ],
    };
  }
  if (areaKey === "enfermagem") {
    return {
      updatedAt: now,
      fields: [
        { id: "e1", type: "texto", label: "Última HbA1c (%)" },
        { id: "e2", type: "texto", label: "Pressão arterial habitual (mmHg)" },
        { id: "e3", type: "sim_nao", label: "Aplica insulina sozinho?" },
        { id: "e4", type: "textarea", label: "Observações de enfermagem" },
      ],
    };
  }
  if (areaKey === "psicologia") {
    return {
      updatedAt: now,
      fields: [
        { id: "p1", type: "textarea", label: "Queixa principal" },
        { id: "p2", type: "sim_nao", label: "Faz acompanhamento psiquiátrico?" },
        { id: "p3", type: "multipla", label: "Sono", options: ["Bom", "Regular", "Ruim"] },
        { id: "p4", type: "textarea", label: "Histórico familiar relevante" },
      ],
    };
  }
  if (areaKey === "podologia") {
    return {
      updatedAt: now,
      fields: [
        { id: "po1", type: "sim_nao", label: "Sente formigamento nos pés?" },
        { id: "po2", type: "sim_nao", label: "Possui calos ou rachaduras?" },
        { id: "po3", type: "multipla", label: "Sensibilidade plantar", options: ["Normal", "Diminuída", "Ausente"] },
        { id: "po4", type: "textarea", label: "Observações" },
      ],
    };
  }
  return { updatedAt: now, fields: [] };
}

class Store {
  clinic: Clinic = {
    name: "Associação Vivae",
    ownerEmail: "demo@vivaehub.com",
    slug: "vivae",
  };
  authed = false;
  /** Profissional "ativo" da sessão — usado para escopar o prontuário por área. */
  activeProfessionalId: string | null = null;

  areas: Area[] = [
    { id: "ar1", name: "Nutrição", color: "oklch(0.66 0.15 155)", key: "nutricao" },
    { id: "ar2", name: "Enfermagem", color: "oklch(0.62 0.16 250)", key: "enfermagem" },
    { id: "ar3", name: "Psicologia", color: "oklch(0.6 0.18 285)", key: "psicologia" },
    { id: "ar4", name: "Podologia", color: "oklch(0.65 0.14 220)", key: "podologia" },
  ];

  professionals: Professional[] = [
    { id: "p1", name: "Dra. Marina Costa", specialty: "Nutricionista", areaId: "ar1", color: "oklch(0.66 0.15 155)", slug: "marina-costa", anamnesisTemplate: defaultTemplate("nutricao") },
    { id: "p2", name: "Enf. André Mello", specialty: "Enfermeiro", areaId: "ar2", color: "oklch(0.62 0.16 250)", slug: "andre-mello", anamnesisTemplate: defaultTemplate("enfermagem") },
    { id: "p3", name: "Dra. Lívia Souza", specialty: "Psicóloga", areaId: "ar3", color: "oklch(0.6 0.18 285)", slug: "livia-souza", anamnesisTemplate: defaultTemplate("psicologia") },
  ];

  patients: Patient[] = [
    {
      id: "pt1",
      name: "Beatriz Almeida",
      phone: "(11) 98765-4321",
      birthDate: "1992-03-12",
      email: "beatriz@email.com",
      professionalId: "p1",
      isContributor: true,
      contributionAmount: CONTRIBUTION_AMOUNT,
      lgptConsent: true,
      personal: {
        cpf: "123.456.789-00",
        cep: "80010-000",
        city: "Curitiba",
        state: "PR",
        profession: "Designer",
      },
      health: {
        diagnosisYear: "2018",
        diabetesType: "tipo1",
        medications: "Insulina basal e bolus",
        howKnewAssociation: "Indicação médica",
        conditions: { ...EMPTY_CONDITIONS, insulina: true, aparelhoGlicemia: true },
      },
      contributions: [
        { id: "c1", date: "2025-03-05", amount: CONTRIBUTION_AMOUNT },
        { id: "c2", date: "2025-04-05", amount: CONTRIBUTION_AMOUNT },
      ],
      notes: [
        { id: "n1", date: "2025-03-10", professionalId: "p1", areaId: "ar1", content: "Iniciou plano alimentar low-carb. Meta: -4kg em 60 dias." },
      ],
      areaAnamneses: [],
      exams: [
        { id: "ex1", name: "Hemograma_completo.pdf", sizeKb: 420, uploadedAt: "2025-03-08" },
      ],
    },
    {
      id: "pt2",
      name: "Carlos Henrique Lima",
      phone: "(11) 91234-5678",
      birthDate: "1985-07-22",
      professionalId: "p2",
      isContributor: false,
      lgptConsent: true,
      health: {
        diabetesType: "tipo2",
        diagnosisYear: "2020",
        conditions: { ...EMPTY_CONDITIONS, hipertensao: true, colesterol: true },
      },
      contributions: [],
      notes: [],
      areaAnamneses: [],
      exams: [],
    },
    {
      id: "pt3",
      name: "Fernanda Reis",
      phone: "(21) 99876-5432",
      birthDate: "1998-11-05",
      professionalId: "p3",
      isContributor: true,
      contributionAmount: CONTRIBUTION_AMOUNT,
      lgptConsent: true,
      contributions: [{ id: "c3", date: "2025-04-02", amount: CONTRIBUTION_AMOUNT }],
      health: {
        diabetesType: "tipo1",
        conditions: { ...EMPTY_CONDITIONS, insulina: true },
      },
      notes: [
        { id: "n2", date: "2025-02-20", professionalId: "p3", areaId: "ar3", content: "Sessão inicial — ansiedade alimentar." },
      ],
      areaAnamneses: [],
      exams: [],
    },
  ];

  appointments: Appointment[] = [];
  scheduleBlocks: ScheduleBlock[] = [];

  finance: FinanceEntry[] = [
    { id: "f1", date: "2025-04-05", description: "Contribuição — Beatriz Almeida", type: "contribuicao", amount: CONTRIBUTION_AMOUNT },
    { id: "f2", date: "2025-04-02", description: "Contribuição — Fernanda Reis", type: "contribuicao", amount: CONTRIBUTION_AMOUNT },
    { id: "f3", date: "2025-03-05", description: "Contribuição — Beatriz Almeida", type: "contribuicao", amount: CONTRIBUTION_AMOUNT },
  ];

  whatsappLogs: WhatsAppLog[] = [];
  reception: ReceptionEntry[] = [];

  private listeners = new Set<Listener>();

  constructor() {
    this.seedAppointments();
    // Por padrão, a sessão "atua como" o primeiro profissional (modo demo).
    this.activeProfessionalId = this.professionals[0]?.id ?? null;
  }

  private seedAppointments() {
    const today = startOfDay(new Date());
    const seed: Appointment[] = [
      { id: "a1", patientId: "pt1", professionalId: "p1", date: addHours(today, 9).toISOString(), durationMin: 45, status: "confirmado", modality: "presencial" },
      { id: "a2", patientId: "pt2", professionalId: "p2", date: addHours(today, 10).toISOString(), durationMin: 30, status: "pendente", modality: "presencial" },
      { id: "a3", patientId: "pt3", professionalId: "p3", date: addHours(today, 14).toISOString(), durationMin: 50, status: "confirmado", modality: "online" },
      { id: "a4", patientId: "pt1", professionalId: "p1", date: addHours(addDays(today, 1), 11).toISOString(), durationMin: 45, status: "pendente", modality: "presencial" },
      { id: "a5", patientId: "pt2", professionalId: "p1", date: addHours(addDays(today, 2), 15).toISOString(), durationMin: 45, status: "confirmado", modality: "presencial" },
    ];
    this.appointments = seed;
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }

  // --- Auth (mocked) ---
  login(email: string, _password: string) {
    this.clinic.ownerEmail = email;
    this.authed = true;
    this.emit();
  }
  signup(clinicName: string, email: string) {
    const slug = slugify(clinicName) || "clinica";
    this.clinic = { name: clinicName, ownerEmail: email, slug };
    this.authed = true;
    this.emit();
  }
  logout() {
    this.authed = false;
    this.emit();
  }
  setActiveProfessional(id: string | null) {
    this.activeProfessionalId = id;
    this.emit();
  }
  getActiveProfessional(): Professional | undefined {
    return this.professionals.find((p) => p.id === this.activeProfessionalId);
  }

  // --- Areas ---
  addArea(name: string) {
    this.areas.push({
      id: crypto.randomUUID(),
      name,
      color: PALETTE[this.areas.length % PALETTE.length],
      key: slugify(name),
    });
    this.emit();
  }
  removeArea(id: string) {
    if (this.professionals.some((p) => p.areaId === id)) return false;
    this.areas = this.areas.filter((a) => a.id !== id);
    this.emit();
    return true;
  }

  // --- Patients ---
  addPatient(p: Omit<Patient, "id" | "notes" | "exams" | "contributions" | "areaAnamneses">) {
    const id = crypto.randomUUID();
    this.patients.push({
      ...p,
      id,
      notes: [],
      exams: [],
      contributions: [],
      areaAnamneses: [],
    });
    if (p.isContributor) {
      this.registerContribution(id);
    }
    this.emit();
    return id;
  }
  updatePatient(id: string, patch: Partial<Patient>) {
    const pt = this.patients.find((x) => x.id === id);
    if (!pt) return;
    Object.assign(pt, patch);
    this.emit();
  }
  addPatientNote(patientId: string, professionalId: string, areaId: string, content: string) {
    const pt = this.patients.find((x) => x.id === patientId);
    if (!pt) return;
    pt.notes.unshift({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      professionalId,
      areaId,
      content,
    });
    this.emit();
  }
  setAreaAnamnesis(patientId: string, anam: AreaAnamnesis) {
    const pt = this.patients.find((x) => x.id === patientId);
    if (!pt) return;
    const existing = pt.areaAnamneses.findIndex((a) => a.areaId === anam.areaId);
    if (existing >= 0) pt.areaAnamneses[existing] = anam;
    else pt.areaAnamneses.push(anam);
    this.emit();
  }
  getAreaAnamnesis(patientId: string, areaId: string): AreaAnamnesis | undefined {
    const pt = this.patients.find((x) => x.id === patientId);
    return pt?.areaAnamneses.find((a) => a.areaId === areaId);
  }
  addPatientExam(patientId: string, name: string, sizeKb: number) {
    const pt = this.patients.find((x) => x.id === patientId);
    if (!pt) return;
    pt.exams.unshift({
      id: crypto.randomUUID(),
      name,
      sizeKb,
      uploadedAt: new Date().toISOString(),
    });
    this.emit();
  }

  getContributionStatus(patientId: string): "contribuinte" | "nao_contribuinte" {
    const pt = this.patients.find((x) => x.id === patientId);
    return pt?.isContributor ? "contribuinte" : "nao_contribuinte";
  }

  /** Registra uma contribuição (sempre R$50). */
  registerContribution(patientId: string) {
    const pt = this.patients.find((x) => x.id === patientId);
    if (!pt) return;
    const today = new Date().toISOString().slice(0, 10);
    pt.isContributor = true;
    pt.contributionAmount = CONTRIBUTION_AMOUNT;
    pt.contributions.unshift({
      id: crypto.randomUUID(),
      date: today,
      amount: CONTRIBUTION_AMOUNT,
    });
    this.finance.unshift({
      id: crypto.randomUUID(),
      date: today,
      description: `Contribuição — ${pt.name}`,
      type: "contribuicao",
      amount: CONTRIBUTION_AMOUNT,
    });
    this.emit();
  }

  getLastContribution(patientId: string): ContributionEntry | undefined {
    const pt = this.patients.find((x) => x.id === patientId);
    return pt?.contributions[0];
  }

  // --- Professionals ---
  addProfessional(p: Omit<Professional, "id" | "color" | "slug" | "anamnesisTemplate"> & { slug?: string }) {
    const area = this.areas.find((a) => a.id === p.areaId);
    const baseSlug = (p.slug && p.slug.trim()) || slugify(p.name);
    const slug = this.uniqueProfessionalSlug(baseSlug);
    this.professionals.push({
      id: crypto.randomUUID(),
      name: p.name,
      specialty: p.specialty,
      areaId: p.areaId,
      slug,
      color: area?.color ?? PALETTE[this.professionals.length % PALETTE.length],
      anamnesisTemplate: defaultTemplate(area?.key ?? ""),
    });
    this.emit();
  }
  updateProfessional(id: string, patch: Partial<Omit<Professional, "id">>) {
    const pro = this.professionals.find((p) => p.id === id);
    if (!pro) return;
    if (patch.slug !== undefined) {
      const next = slugify(patch.slug);
      patch.slug = this.uniqueProfessionalSlug(next, id);
    }
    Object.assign(pro, patch);
    this.emit();
  }
  setProfessionalTemplate(id: string, fields: AnamnesisField[]) {
    const pro = this.professionals.find((p) => p.id === id);
    if (!pro) return;
    pro.anamnesisTemplate = { fields, updatedAt: new Date().toISOString() };
    this.emit();
  }
  private uniqueProfessionalSlug(base: string, ignoreId?: string): string {
    const taken = new Set(
      this.professionals.filter((p) => p.id !== ignoreId).map((p) => p.slug),
    );
    if (!taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }
  findProfessionalBySlug(slug: string) {
    return this.professionals.find((p) => p.slug === slug);
  }

  // --- Schedule blocks ---
  addBlock(b: Omit<ScheduleBlock, "id">) {
    this.scheduleBlocks.push({ ...b, id: crypto.randomUUID() });
    this.emit();
  }
  removeBlock(id: string) {
    this.scheduleBlocks = this.scheduleBlocks.filter((b) => b.id !== id);
    this.emit();
  }
  /** Verifica se um intervalo está bloqueado para o profissional. */
  isBlocked(professionalId: string, isoStart: string, durationMin = 45): boolean {
    const start = new Date(isoStart).getTime();
    const end = start + durationMin * 60_000;
    return this.scheduleBlocks.some((b) => {
      if (b.professionalId !== professionalId) return false;
      const bs = new Date(b.start).getTime();
      const be = new Date(b.end).getTime();
      return start < be && end > bs;
    });
  }
  getBlocksForProfessional(professionalId: string): ScheduleBlock[] {
    return this.scheduleBlocks
      .filter((b) => b.professionalId === professionalId)
      .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  }

  // --- Appointments ---
  addAppointment(a: Omit<Appointment, "id">) {
    if (this.isBlocked(a.professionalId, a.date, a.durationMin)) {
      // Não cria. Caller deve checar antes — retornamos string vazia para sinalizar.
      return "";
    }
    const id = crypto.randomUUID();
    this.appointments.push({ ...a, id });
    const pt = this.patients.find((p) => p.id === a.patientId);
    if (pt) {
      const when = format(new Date(a.date), "dd/MM 'às' HH:mm");
      this.whatsappLogs.unshift({
        id: crypto.randomUUID(),
        to: pt.phone,
        message: `Olá ${pt.name.split(" ")[0]}! Sua consulta na ${this.clinic.name} foi marcada para ${when}. Responda SIM para confirmar.`,
        sentAt: new Date().toISOString(),
        kind: "confirmacao",
      });
    }
    this.emit();
    return id;
  }
  updateAppointmentStatus(id: string, status: Appointment["status"]) {
    const a = this.appointments.find((x) => x.id === id);
    if (a) {
      a.status = status;
      this.emit();
    }
  }
  updateAppointmentNotes(id: string, notes: string) {
    const a = this.appointments.find((x) => x.id === id);
    if (a) {
      a.notes = notes;
      this.emit();
    }
  }
  sendReminder(appointmentId: string) {
    const a = this.appointments.find((x) => x.id === appointmentId);
    if (!a) return;
    const pt = this.patients.find((p) => p.id === a.patientId);
    if (!pt) return;
    const when = format(new Date(a.date), "dd/MM 'às' HH:mm");
    this.whatsappLogs.unshift({
      id: crypto.randomUUID(),
      to: pt.phone,
      message: `Lembrete: você tem consulta amanhã (${when}) na ${this.clinic.name}. Te esperamos!`,
      sentAt: new Date().toISOString(),
      kind: "lembrete",
    });
    this.emit();
  }

  // --- Reception ---
  checkIn(appointmentId: string) {
    const exists = this.reception.find((r) => r.appointmentId === appointmentId);
    if (exists) return;
    this.reception.push({
      id: crypto.randomUUID(),
      appointmentId,
      arrivedAt: new Date().toISOString(),
      status: "aguardando",
    });
    this.emit();
  }
  callPatient(receptionId: string) {
    const r = this.reception.find((x) => x.id === receptionId);
    if (!r) return;
    r.status = "em_atendimento";
    r.startedAt = new Date().toISOString();
    this.emit();
  }
  finishReception(receptionId: string) {
    const r = this.reception.find((x) => x.id === receptionId);
    if (!r) return;
    r.status = "finalizado";
    r.finishedAt = new Date().toISOString();
    const a = this.appointments.find((x) => x.id === r.appointmentId);
    if (a) a.status = "confirmado";
    this.emit();
  }

  // --- Finance ---
  addFinance(e: Omit<FinanceEntry, "id">) {
    this.finance.unshift({ ...e, id: crypto.randomUUID() });
    this.emit();
  }
  getTotalRaised(): number {
    return this.finance
      .filter((e) => e.type === "contribuicao")
      .reduce((s, e) => s + e.amount, 0);
  }
}

export const store = new Store();

export const DIABETES_TYPE_LABEL: Record<NonNullable<PatientHealth["diabetesType"]>, string> = {
  tipo1: "Tipo 1",
  tipo2: "Tipo 2",
  gestacional: "Gestacional",
  lada: "LADA",
  mody: "MODY",
  outro: "Outro",
};
