// In-memory mock store for the SaaS demo.
// Simulates multi-tenant: each "session" works inside a single clinic.

import { addDays, addHours, format, startOfDay } from "date-fns";

export type Professional = {
  id: string;
  name: string;
  specialty: string;
  color: string;
};

export type Patient = {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  notes: PatientNote[];
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
  kind: "confirmacao" | "lembrete";
};

export type Clinic = {
  name: string;
  ownerEmail: string;
};

type Listener = () => void;

class Store {
  clinic: Clinic = { name: "Clínica Vitalis", ownerEmail: "demo@vitalis.com" };
  authed = false;

  professionals: Professional[] = [
    { id: "p1", name: "Dra. Marina Costa", specialty: "Nutricionista", color: "oklch(0.58 0.13 190)" },
    { id: "p2", name: "Dr. André Mello", specialty: "Endocrinologista", color: "oklch(0.65 0.13 220)" },
    { id: "p3", name: "Dra. Lívia Souza", specialty: "Psicóloga", color: "oklch(0.66 0.15 155)" },
  ];

  patients: Patient[] = [
    {
      id: "pt1",
      name: "Beatriz Almeida",
      phone: "(11) 98765-4321",
      birthDate: "1992-03-12",
      notes: [
        { id: "n1", date: "2025-03-10", professionalId: "p1", content: "Iniciou plano alimentar low-carb. Meta: -4kg em 60 dias." },
      ],
    },
    {
      id: "pt2",
      name: "Carlos Henrique Lima",
      phone: "(11) 91234-5678",
      birthDate: "1985-07-22",
      notes: [],
    },
    {
      id: "pt3",
      name: "Fernanda Reis",
      phone: "(21) 99876-5432",
      birthDate: "1998-11-05",
      notes: [
        { id: "n2", date: "2025-02-20", professionalId: "p3", content: "Sessão inicial — ansiedade alimentar." },
      ],
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

  private listeners = new Set<Listener>();

  constructor() {
    this.seedAppointments();
  }

  private seedAppointments() {
    const today = startOfDay(new Date());
    const seed: Appointment[] = [
      { id: "a1", patientId: "pt1", professionalId: "p1", date: addHours(today, 9).toISOString(), durationMin: 45, status: "confirmado" },
      { id: "a2", patientId: "pt2", professionalId: "p2", date: addHours(today, 10).toISOString(), durationMin: 30, status: "pendente" },
      { id: "a3", patientId: "pt3", professionalId: "p3", date: addHours(today, 14).toISOString(), durationMin: 50, status: "confirmado" },
      { id: "a4", patientId: "pt1", professionalId: "p1", date: addHours(addDays(today, 1), 11).toISOString(), durationMin: 45, status: "pendente" },
      { id: "a5", patientId: "pt2", professionalId: "p1", date: addHours(addDays(today, 2), 15).toISOString(), durationMin: 45, status: "confirmado" },
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
    this.clinic = { name: clinicName, ownerEmail: email };
    this.authed = true;
    this.emit();
  }
  logout() {
    this.authed = false;
    this.emit();
  }

  // --- Patients ---
  addPatient(p: Omit<Patient, "id" | "notes">) {
    this.patients.push({ ...p, id: crypto.randomUUID(), notes: [] });
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

  // --- Professionals ---
  addProfessional(p: Omit<Professional, "id" | "color">) {
    const palette = ["oklch(0.58 0.13 190)", "oklch(0.65 0.13 220)", "oklch(0.66 0.15 155)", "oklch(0.7 0.14 75)"];
    this.professionals.push({
      ...p,
      id: crypto.randomUUID(),
      color: palette[this.professionals.length % palette.length],
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

  // --- Members ---
  addMember(m: Omit<Member, "id" | "payments" | "monthlyFee" | "active"> & { monthlyFee?: number }) {
    this.members.push({
      ...m,
      id: crypto.randomUUID(),
      active: true,
      monthlyFee: m.monthlyFee ?? 50,
      payments: [],
    });
    this.emit();
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
