import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  Trash2,
  Sparkles,
  Upload,
} from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  type ActivityLevel,
  type Anamnesis,
  type Goal,
  ACTIVITY_LABEL,
  GOAL_LABEL,
} from "@/lib/mock-store";

export const Route = createFileRoute("/portal/$slug")({
  component: PatientPortal,
});

const STEPS = [
  { id: 1, title: "Agendamento" },
  { id: 2, title: "Anamnese" },
  { id: 3, title: "Exames" },
  { id: 4, title: "Avaliação" },
  { id: 5, title: "Confirmação" },
];

const RECOMMENDED_EXAMS = [
  "Hemograma completo",
  "Glicemia em jejum",
  "Colesterol total e frações",
  "TSH e T4 livre",
  "Vitamina D",
  "Vitamina B12",
];

type ExamUpload = { name: string; sizeKb: number };

function PatientPortal() {
  const { slug } = Route.useParams();
  const store = useStore();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  // Step 1
  const [proId, setProId] = useState("");
  const [date, setDate] = useState(format(addDays(startOfDay(new Date()), 1), "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");
  const [modality, setModality] = useState<"presencial" | "online">("presencial");

  // Step 2 — anamnese
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [sex, setSex] = useState<"F" | "M" | "outro">("F");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState<Goal>("emagrecimento");
  const [diseases, setDiseases] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [surgeries, setSurgeries] = useState("");
  const [eatingHabits, setEatingHabits] = useState("");
  const [activity, setActivity] = useState<ActivityLevel>("moderado");

  // Step 3
  const [exams, setExams] = useState<ExamUpload[]>([]);

  // Step 4
  const [evaluation, setEvaluation] = useState<"dobras" | "bioimpedancia" | "nenhuma">("nenhuma");

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newOnes: ExamUpload[] = [];
    for (const f of Array.from(files)) {
      if (exams.length + newOnes.length >= 8) {
        toast.error("Máximo de 8 arquivos");
        break;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} excede 10MB`);
        continue;
      }
      newOnes.push({ name: f.name, sizeKb: Math.round(f.size / 1024) });
    }
    setExams((prev) => [...prev, ...newOnes]);
  }

  function next() {
    if (step === 2) {
      if (!name.trim() || !phone.trim()) {
        toast.error("Preencha nome e WhatsApp");
        return;
      }
    }
    setStep((s) => Math.min(5, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(1, s - 1));
  }

  function confirm() {
    if (!proId) {
      toast.error("Selecione um profissional");
      setStep(1);
      return;
    }

    // 1. Cria paciente (sempre associado automaticamente; sem contribuição por enquanto)
    const patientId = store.addPatient({
      name,
      phone,
      birthDate: age
        ? new Date(new Date().getFullYear() - Number(age), 0, 1).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      email,
      professionalId: proId,
      isContributor: false,
    });

    // 2. Anamnese
    const anam: Anamnesis = {
      filledAt: new Date().toISOString(),
      age: age === "" ? undefined : Number(age),
      sex,
      email,
      goal,
      diseases,
      allergies,
      medications,
      surgeries,
      eatingHabits,
      activity,
      evaluation,
    };
    store.setPatientAnamnesis(patientId, anam);

    // 3. Exames
    for (const ex of exams) store.addPatientExam(patientId, ex.name, ex.sizeKb);

    // 4. Agendamento
    const iso = new Date(`${date}T${time}:00`).toISOString();
    store.addAppointment({
      patientId,
      professionalId: proId,
      date: iso,
      durationMin: 45,
      status: "pendente",
      modality,
    });

    setDone(true);
  }

  if (done) {
    return <Success slug={slug} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">{store.clinic.name}</div>
            <div className="text-xs text-muted-foreground">Portal do paciente · /{slug}</div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div
                  className={
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 " +
                    (step > s.id
                      ? "bg-success text-success-foreground"
                      : step === s.id
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "bg-muted text-muted-foreground")
                  }
                >
                  {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={
                      "flex-1 h-0.5 mx-1 " +
                      (step > s.id ? "bg-success" : "bg-muted")
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2 text-sm font-medium">
            Etapa {step} de 5 · {STEPS[step - 1].title}
          </div>
        </div>

        <Card className="p-5 md:p-7 shadow-soft">
          {step === 1 && (
            <Step1
              store={store}
              proId={proId}
              setProId={setProId}
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              modality={modality}
              setModality={setModality}
            />
          )}
          {step === 2 && (
            <Step2
              name={name}
              setName={setName}
              age={age}
              setAge={setAge}
              sex={sex}
              setSex={setSex}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              goal={goal}
              setGoal={setGoal}
              diseases={diseases}
              setDiseases={setDiseases}
              allergies={allergies}
              setAllergies={setAllergies}
              medications={medications}
              setMedications={setMedications}
              surgeries={surgeries}
              setSurgeries={setSurgeries}
              eatingHabits={eatingHabits}
              setEatingHabits={setEatingHabits}
              activity={activity}
              setActivity={setActivity}
            />
          )}
          {step === 3 && (
            <Step3 exams={exams} setExams={setExams} onFiles={handleFiles} />
          )}
          {step === 4 && <Step4 evaluation={evaluation} setEvaluation={setEvaluation} />}
          {step === 5 && (
            <Step5
              store={store}
              proId={proId}
              date={date}
              time={time}
              modality={modality}
              name={name}
              age={age}
              goal={goal}
              activity={activity}
              evaluation={evaluation}
              examsCount={exams.length}
            />
          )}
        </Card>

        <div className="flex items-center justify-between mt-5">
          <Button variant="ghost" onClick={prev} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          {step < 5 ? (
            <Button onClick={next} className="gradient-primary">
              Continuar <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={confirm} className="gradient-primary shadow-glow">
              <CalendarCheck className="h-4 w-4 mr-1" /> Confirmar agendamento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step1(props: {
  store: ReturnType<typeof useStore>;
  proId: string;
  setProId: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  modality: "presencial" | "online";
  setModality: (v: "presencial" | "online") => void;
}) {
  const { store, proId, setProId, date, setDate, time, setTime, modality, setModality } = props;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Agende sua consulta</h2>
        <p className="text-sm text-muted-foreground">
          Escolha profissional, dia e horário.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Profissional / área</Label>
        <Select value={proId} onValueChange={setProId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {store.professionals.map((p) => {
              const area = store.areas.find((a) => a.id === p.areaId);
              return (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {area?.name ?? p.specialty}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Horário</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Modalidade</Label>
        <RadioGroup
          value={modality}
          onValueChange={(v) => setModality(v as "presencial" | "online")}
          className="grid grid-cols-2 gap-2"
        >
          <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="presencial" /> Presencial
          </label>
          <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="online" /> Online
          </label>
        </RadioGroup>
      </div>
    </div>
  );
}

type Step2Props = {
  name: string;
  setName: (v: string) => void;
  age: number | "";
  setAge: (v: number | "") => void;
  sex: "F" | "M" | "outro";
  setSex: (v: "F" | "M" | "outro") => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  goal: Goal;
  setGoal: (v: Goal) => void;
  diseases: string;
  setDiseases: (v: string) => void;
  allergies: string;
  setAllergies: (v: string) => void;
  medications: string;
  setMedications: (v: string) => void;
  surgeries: string;
  setSurgeries: (v: string) => void;
  eatingHabits: string;
  setEatingHabits: (v: string) => void;
  activity: ActivityLevel;
  setActivity: (v: ActivityLevel) => void;
};

function Step2(p: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Conte sobre você</h2>
        <p className="text-sm text-muted-foreground">
          Essas informações vão direto para o seu prontuário.
        </p>
      </div>

      <Section title="Dados pessoais">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome completo *</Label>
            <Input value={p.name} onChange={(e) => p.setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Idade</Label>
            <Input
              type="number"
              value={p.age}
              onChange={(e) => p.setAge(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sexo</Label>
            <Select value={p.sex} onValueChange={(v) => p.setSex(v as "F" | "M" | "outro")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" value={p.email} onChange={(e) => p.setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp *</Label>
            <Input value={p.phone} onChange={(e) => p.setPhone(e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="Objetivo">
        <RadioGroup
          value={p.goal}
          onValueChange={(v) => p.setGoal(v as Goal)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
            <label
              key={g}
              className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
            >
              <RadioGroupItem value={g} />
              <span className="text-sm">{GOAL_LABEL[g]}</span>
            </label>
          ))}
        </RadioGroup>
      </Section>

      <Section title="Histórico de saúde">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Doenças</Label>
            <Input value={p.diseases} onChange={(e) => p.setDiseases(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Alergias</Label>
            <Input value={p.allergies} onChange={(e) => p.setAllergies(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Medicamentos</Label>
            <Input value={p.medications} onChange={(e) => p.setMedications(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cirurgias</Label>
            <Input value={p.surgeries} onChange={(e) => p.setSurgeries(e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="Hábitos alimentares">
        <Textarea
          value={p.eatingHabits}
          onChange={(e) => p.setEatingHabits(e.target.value)}
          rows={3}
          placeholder="Conte como é sua rotina alimentar (refeições, beliscos, frequência…)"
        />
      </Section>

      <Section title="Nível de atividade física">
        <RadioGroup
          value={p.activity}
          onValueChange={(v) => p.setActivity(v as ActivityLevel)}
          className="grid grid-cols-2 sm:grid-cols-5 gap-2"
        >
          {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((a) => (
            <label
              key={a}
              className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-muted/50 text-xs"
            >
              <RadioGroupItem value={a} />
              {ACTIVITY_LABEL[a]}
            </label>
          ))}
        </RadioGroup>
      </Section>
    </div>
  );
}

function Step3({
  exams,
  setExams,
  onFiles,
}: {
  exams: ExamUpload[];
  setExams: (v: ExamUpload[]) => void;
  onFiles: (f: FileList | null) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Anexe seus exames</h2>
        <p className="text-sm text-muted-foreground">
          Até 8 arquivos PDF, 10MB cada. Opcional, mas ajuda na consulta.
        </p>
      </div>

      <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/40 transition-smooth">
        <Upload className="h-6 w-6 text-muted-foreground" />
        <div className="text-sm font-medium">Clique para selecionar PDFs</div>
        <div className="text-xs text-muted-foreground">
          {exams.length}/8 anexados
        </div>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>

      {exams.length > 0 && (
        <div className="space-y-2">
          {exams.map((ex, i) => (
            <div
              key={`${ex.name}-${i}`}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{ex.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(ex.sizeKb / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                onClick={() => setExams(exams.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm font-medium mb-2">
          <Sparkles className="h-4 w-4 text-primary" /> Exames recomendados
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RECOMMENDED_EXAMS.map((e) => (
            <Badge key={e} variant="outline" className="text-xs">
              {e}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({
  evaluation,
  setEvaluation,
}: {
  evaluation: "dobras" | "bioimpedancia" | "nenhuma";
  setEvaluation: (v: "dobras" | "bioimpedancia" | "nenhuma") => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Avaliação física</h2>
        <p className="text-sm text-muted-foreground">
          Escolha o método de avaliação corporal que prefere.
        </p>
      </div>

      <RadioGroup
        value={evaluation}
        onValueChange={(v) => setEvaluation(v as "dobras" | "bioimpedancia" | "nenhuma")}
        className="space-y-2"
      >
        <Choice value="dobras" title="Dobras cutâneas" desc="Medição manual com adipômetro." />
        <Choice
          value="bioimpedancia"
          title="Bioimpedância"
          desc="Análise da composição corporal por aparelho."
        />
        <Choice value="nenhuma" title="Sem avaliação" desc="Apenas a consulta clínica." />
      </RadioGroup>
    </div>
  );
}

function Choice({ value, title, desc }: { value: string; title: string; desc: string }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/40 transition-smooth has-[:checked]:border-primary has-[:checked]:bg-primary/5">
      <RadioGroupItem value={value} className="mt-0.5" />
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </label>
  );
}

function Step5(props: {
  store: ReturnType<typeof useStore>;
  proId: string;
  date: string;
  time: string;
  modality: "presencial" | "online";
  name: string;
  age: number | "";
  goal: Goal;
  activity: ActivityLevel;
  evaluation: "dobras" | "bioimpedancia" | "nenhuma";
  examsCount: number;
}) {
  const pro = props.store.professionals.find((p) => p.id === props.proId);
  const area = props.store.areas.find((a) => a.id === pro?.areaId);
  const dateObj = new Date(`${props.date}T${props.time}:00`);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Confira e confirme</h2>
        <p className="text-sm text-muted-foreground">
          Revise os dados antes de enviar à clínica.
        </p>
      </div>

      <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-1">
          <CalendarCheck className="h-4 w-4 text-primary" /> Sua consulta
        </div>
        <div className="text-sm">
          {format(dateObj, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </div>
        <div className="text-xs text-muted-foreground">
          {pro?.name ?? "—"} · {area?.name ?? "—"} · {props.modality}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Item label="Paciente" value={props.name || "—"} />
        <Item label="Idade" value={props.age || "—"} />
        <Item label="Objetivo" value={GOAL_LABEL[props.goal]} />
        <Item label="Atividade" value={ACTIVITY_LABEL[props.activity]} />
        <Item
          label="Avaliação"
          value={
            props.evaluation === "dobras"
              ? "Dobras cutâneas"
              : props.evaluation === "bioimpedancia"
                ? "Bioimpedância"
                : "Nenhuma"
          }
        />
        <Item label="Exames" value={`${props.examsCount} arquivo(s)`} />
      </div>

      <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/40 border">
        Ao confirmar, criamos automaticamente seu cadastro, agendamento e prontuário.
        Você receberá uma confirmação no WhatsApp.
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
        {title}
      </div>
      {children}
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3 bg-card">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Success({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center shadow-elegant">
        <div className="mx-auto h-14 w-14 rounded-full bg-success/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Agendamento confirmado!</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Você receberá uma confirmação via WhatsApp em instantes. Sua anamnese e exames
          já estão no seu prontuário.
        </p>
        <Link
          to="/portal/$slug"
          params={{ slug }}
          reloadDocument
          className="inline-flex items-center justify-center gap-2 rounded-md gradient-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-soft"
        >
          Fazer outro agendamento
        </Link>
      </Card>
    </div>
  );
}
