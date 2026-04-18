// In-memory mock store for the SaaS demo.
// Simulates multi-tenant: each "session" works inside a single clinic.

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

export type Patient = {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  email?: string;
  memberId?: string; // vínculo opcional com associado
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

export type Member = {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  active: boolean;
  monthlyFee: number;
  payments: { id: string; date: string; amount: number; status: "pago" | "pendente" }[];
};

export type FinanceEntry = {
  id: string;
  date: string;
  description: string;
  type: "mensalidade" | "consulta";
  amount: number;
  status: "pago" | "pendente";
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
};

type Listener = () => void;

const PALETTE = [
  "oklch(0.58 0.13 190)",
  "oklch(0.65 0.13 220)",
  "oklch(0.66 0.15 155)",
  "oklch(0.7 0.14 75)",
  "oklch(0.62 0.16 30)",
  "oklch(0.6 0.18 300)",
];

class Store {
  clinic: Clinic = { name: "Clínica Vitalis", ownerEmail: "demo@vitalis.com", slug: "vitalis" };
  authed = false;

  areas: Area[] = [
    { id: "ar1", name: "Nutrição", color: "oklch(0.66 0.15 155)" },
    { id: "ar2", name: "Endocrinologia", color: "oklch(0.65 0.13 220)" },
    { id: "ar3", name: "Psicologia", color: "oklch(0.6 0.18 300)" },
  ];

  professionals: Professional[] = [
    { id: "p1", name: "Dra. Marina Costa", specialty: "Nutricionista", areaId: "ar1", color: "oklch(0.66 0.15 155)" },
    { id: "p2", name: "Dr. André Mello", specialty: "Endocrinologista", areaId: "ar2", color: "oklch(0.65 0.13 220)" },
    { id: "p3", name: "Dra. Lívia Souza", specialty: "Psicóloga", areaId: "ar3", color: "oklch(0.6 0.18 300)" },
  ];

  patients: Patient[] = [
    {
      id: "pt1",
      name: "Beatriz Almeida",
      phone: "(11) 98765-4321",
      birthDate: "1992-03-12",
      email: "beatriz@email.com",
      memberId: "m2",
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
      notes: [],
      exams: [],
    },
    {
      id: "pt3",
      name: "Fernanda Reis",
      phone: "(21) 99876-5432",
      birthDate: "1998-11-05",
      notes: [
        { id: "n2", date: "2025-02-20", professionalId: "p3", content: "Sessão inicial — ansiedade alimentar." },
      ],
      exams: [],
    },
  ];

  appointments: Appointment[] = [];

  members: Member[] = [
    {
      id: "m1",
      name: "João Pereira",
      cpf: "123.456.789-00",
      phone: "(11) 99999-1111",
      active: true,
      monthlyFee: 50,
      payments: [
        { id: "pay1", date: "2025-03-01", amount: 50, status: "pago" },
        { id: "pay2", date: "2025-04-01", amount: 50, status: "pendente" },
      ],
    },
    {
      id: "m2",
      name: "Mariana Silva",
      cpf: "987.654.321-00",
      phone: "(11) 98888-2222",
      active: true,
      monthlyFee: 50,
      payments: [{ id: "pay3", date: "2025-04-01", amount: 50, status: "pago" }],
    },
    {
      id: "m3",
      name: "Roberto Dias",
      cpf: "456.789.123-00",
      phone: "(11) 97777-3333",
      active: false,
      monthlyFee: 50,
      payments: [{ id: "pay4", date: "2025-02-01", amount: 50, status: "pendente" }],
    },
  ];

  finance: FinanceEntry[] = [
    { id: "f1", date: "2025-04-01", description: "Mensalidade — Mariana Silva", type: "mensalidade", amount: 50, status: "pago" },
    { id: "f2", date: "2025-04-03", description: "Consulta — Beatriz Almeida", type: "consulta", amount: 220, status: "pago" },
    { id: "f3", date: "2025-04-05", description: "Consulta — Carlos H. Lima", type: "consulta", amount: 220, status: "pendente" },
    { id: "f4", date: "2025-04-08", description: "Mensalidade — João Pereira", type: "mensalidade", amount: 50, status: "pendente" },
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
    const slug = clinicName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "clinica";
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
  addPatient(p: Omit<Patient, "id" | "notes" | "exams">) {
    const id = crypto.randomUUID();
    this.patients.push({ ...p, id, notes: [], exams: [] });
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

  /** Returns delinquent status for a patient (via member link). */
  getPatientFinancialStatus(patientId: string): "adimplente" | "inadimplente" | "nao_associado" {
    const pt = this.patients.find((x) => x.id === patientId);
    if (!pt?.memberId) return "nao_associado";
    const m = this.members.find((x) => x.id === pt.memberId);
    if (!m) return "nao_associado";
    return m.payments.some((p) => p.status === "pendente") ? "inadimplente" : "adimplente";
  }

  // --- Professionals ---
  addProfessional(p: Omit<Professional, "id" | "color">) {
    const area = this.areas.find((a) => a.id === p.areaId);
    this.professionals.push({
      ...p,
      id: crypto.randomUUID(),
      color: area?.color ?? PALETTE[this.professionals.length % PALETTE.length],
    });
    this.emit();
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
        message: `Olá ${pt.name.split(" ")[0]}! Sua consulta foi marcada para ${when}. Responda SIM para confirmar.`,
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
      message: `Lembrete: você tem consulta amanhã (${when}). Te esperamos!`,
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

  // --- Members ---
  addMember(m: Omit<Member, "id" | "payments" | "monthlyFee" | "active"> & { monthlyFee?: number }) {
    const id = crypto.randomUUID();
    this.members.push({
      ...m,
      id,
      active: true,
      monthlyFee: m.monthlyFee ?? 50,
      payments: [],
    });
    this.emit();
    return id;
  }
  togglePayment(memberId: string, paymentId: string) {
    const m = this.members.find((x) => x.id === memberId);
    const p = m?.payments.find((x) => x.id === paymentId);
    if (p) {
      p.status = p.status === "pago" ? "pendente" : "pago";
      this.emit();
    }
  }
  registerMonthlyPayment(memberId: string) {
    const m = this.members.find((x) => x.id === memberId);
    if (!m) return;
    m.payments.unshift({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      amount: m.monthlyFee,
      status: "pago",
    });
    this.finance.unshift({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      description: `Mensalidade — ${m.name}`,
      type: "mensalidade",
      amount: m.monthlyFee,
      status: "pago",
    });
    this.emit();
  }

  // --- Finance ---
  addFinance(e: Omit<FinanceEntry, "id">) {
    this.finance.unshift({ ...e, id: crypto.randomUUID() });
    this.emit();
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
