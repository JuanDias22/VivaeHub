// In-memory mock store for the VivaeHub SaaS demo.
// Multi-tenant: each "session" works inside a single clinic/association.
// Modelo: todo paciente é associado automaticamente; contribuição é voluntária (>= R$50).

import { addDays, addHours, format, startOfDay } from "date-fns";

export type Area = {
  id: string;
  name: string;
  color: string;
};

export type Professional = {
  id: string;
  name: string;
  specialty: string;
  areaId: string;
  color: string;
  slug: string;
};

export type ActivityLevel = "sedentario" | "leve" | "moderado" | "intenso" | "atleta";
export type Goal =
  | "emagrecimento"
  | "ganho_massa"
  | "saude_bemestar"
  | "performance"
  | "reeducacao"
  | "condicao_clinica";

export type Anamnesis = {
  filledAt: string;
  age?: number;
  sex?: "F" | "M" | "outro";
  email?: string;
  goal?: Goal;
  diseases?: string;
  allergies?: string;
  medications?: string;
  surgeries?: string;
  eatingHabits?: string;
  activity?: ActivityLevel;
  evaluation?: "dobras" | "bioimpedancia" | "nenhuma";
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

export type Patient = {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  email?: string;
  /** Profissional responsável principal pelo paciente. */
  professionalId?: string;
  /** Se o paciente optou por contribuir voluntariamente. */
  isContributor: boolean;
  /** Valor mensal de contribuição (>= 50 quando isContributor). */
  contributionAmount?: number;
  /** Histórico de contribuições registradas. */
  contributions: ContributionEntry[];
  notes: PatientNote[];
  anamnesis?: Anamnesis;
  exams: ExamFile[];
};

export type PatientNote = {
  id: string;
  date: string;
  professionalId: string;
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

export const MIN_CONTRIBUTION = 50;

const PALETTE = [
  "oklch(0.62 0.16 250)", // primary blue
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

class Store {
  clinic: Clinic = {
    name: "Associação Vivae",
    ownerEmail: "demo@vivaehub.com",
    slug: "vivae",
  };
  authed = false;

  areas: Area[] = [
    { id: "ar1", name: "Nutrição", color: "oklch(0.66 0.15 155)" },
    { id: "ar2", name: "Enfermagem", color: "oklch(0.62 0.16 250)" },
    { id: "ar3", name: "Psicologia", color: "oklch(0.6 0.18 285)" },
    { id: "ar4", name: "Podologia", color: "oklch(0.65 0.14 220)" },
  ];

  professionals: Professional[] = [
    { id: "p1", name: "Dra. Marina Costa", specialty: "Nutricionista", areaId: "ar1", color: "oklch(0.66 0.15 155)", slug: "marina-costa" },
    { id: "p2", name: "Enf. André Mello", specialty: "Enfermeiro", areaId: "ar2", color: "oklch(0.62 0.16 250)", slug: "andre-mello" },
    { id: "p3", name: "Dra. Lívia Souza", specialty: "Psicóloga", areaId: "ar3", color: "oklch(0.6 0.18 285)", slug: "livia-souza" },
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
      contributionAmount: 80,
      contributions: [
        { id: "c1", date: "2025-03-05", amount: 80 },
        { id: "c2", date: "2025-04-05", amount: 80 },
      ],
      notes: [
        { id: "n1", date: "2025-03-10", professionalId: "p1", content: "Iniciou plano alimentar low-carb. Meta: -4kg em 60 dias." },
      ],
      anamnesis: {
        filledAt: "2025-03-08",
        age: 33,
        sex: "F",
        email: "beatriz@email.com",
        goal: "emagrecimento",
        diseases: "Nenhuma",
        allergies: "Lactose",
        medications: "Nenhum",
        surgeries: "Nenhuma",
        eatingHabits: "3 refeições principais, beliscos à tarde.",
        activity: "leve",
        evaluation: "bioimpedancia",
      },
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
      contributions: [],
      notes: [],
      exams: [],
    },
    {
      id: "pt3",
      name: "Fernanda Reis",
      phone: "(21) 99876-5432",
      birthDate: "1998-11-05",
      professionalId: "p3",
      isContributor: true,
      contributionAmount: 50,
      contributions: [{ id: "c3", date: "2025-04-02", amount: 50 }],
      notes: [
        { id: "n2", date: "2025-02-20", professionalId: "p3", content: "Sessão inicial — ansiedade alimentar." },
      ],
      exams: [],
    },
  ];

  appointments: Appointment[] = [];

  finance: FinanceEntry[] = [
    { id: "f1", date: "2025-04-05", description: "Contribuição — Beatriz Almeida", type: "contribuicao", amount: 80 },
    { id: "f2", date: "2025-04-02", description: "Contribuição — Fernanda Reis", type: "contribuicao", amount: 50 },
    { id: "f3", date: "2025-03-05", description: "Contribuição — Beatriz Almeida", type: "contribuicao", amount: 80 },
  ];

  whatsappLogs: WhatsAppLog[] = [];

  reception: ReceptionEntry[] = [];

  private listeners = new Set<Listener>();

  constructor() {
    this.seedAppointments();
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

  // --- Areas ---
  addArea(name: string) {
    this.areas.push({
      id: crypto.randomUUID(),
      name,
      color: PALETTE[this.areas.length % PALETTE.length],
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
  addPatient(p: Omit<Patient, "id" | "notes" | "exams" | "contributions">) {
    const id = crypto.randomUUID();
    this.patients.push({ ...p, id, notes: [], exams: [], contributions: [] });
    this.emit();
    return id;
  }
  updatePatient(id: string, patch: Partial<Patient>) {
    const pt = this.patients.find((x) => x.id === id);
    if (!pt) return;
    Object.assign(pt, patch);
    this.emit();
  }
  addPatientNote(patientId: string, professionalId: string, content: string) {
    const pt = this.patients.find((x) => x.id === patientId);
    if (!pt) return;
    pt.notes.unshift({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      professionalId,
      content,
    });
    this.emit();
  }
  setPatientAnamnesis(patientId: string, a: Anamnesis) {
    const pt = this.patients.find((x) => x.id === patientId);
    if (!pt) return;
    pt.anamnesis = a;
    this.emit();
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

  /** Status de contribuição do paciente. */
  getContributionStatus(patientId: string): "contribuinte" | "nao_contribuinte" {
    const pt = this.patients.find((x) => x.id === patientId);
    return pt?.isContributor ? "contribuinte" : "nao_contribuinte";
  }

  /** Registra uma contribuição do paciente e cria entrada no financeiro. */
  registerContribution(patientId: string, amount?: number) {
    const pt = this.patients.find((x) => x.id === patientId);
    if (!pt) return;
    const value = amount ?? pt.contributionAmount ?? MIN_CONTRIBUTION;
    if (value < MIN_CONTRIBUTION) return;
    const today = new Date().toISOString().slice(0, 10);
    pt.isContributor = true;
    pt.contributionAmount = value;
    pt.contributions.unshift({
      id: crypto.randomUUID(),
      date: today,
      amount: value,
    });
    this.finance.unshift({
      id: crypto.randomUUID(),
      date: today,
      description: `Contribuição — ${pt.name}`,
      type: "contribuicao",
      amount: value,
    });
    this.emit();
  }

  /** Última contribuição registrada. */
  getLastContribution(patientId: string): ContributionEntry | undefined {
    const pt = this.patients.find((x) => x.id === patientId);
    return pt?.contributions[0];
  }

  // --- Professionals ---
  addProfessional(p: Omit<Professional, "id" | "color" | "slug"> & { slug?: string }) {
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

  // --- Appointments ---
  addAppointment(a: Omit<Appointment, "id">) {
    const id = crypto.randomUUID();
    this.appointments.push({ ...a, id });
    // Simulate WhatsApp confirmation
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

export const GOAL_LABEL: Record<Goal, string> = {
  emagrecimento: "Emagrecimento",
  ganho_massa: "Ganho de massa",
  saude_bemestar: "Saúde e bem-estar",
  performance: "Performance esportiva",
  reeducacao: "Reeducação alimentar",
  condicao_clinica: "Condição clínica",
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentario: "Sedentário",
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
  atleta: "Atleta",
};
