import { useState } from "react";
import { Link } from "@tanstack/react-router";
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
  HeartHandshake,
  UserCheck,
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
  MIN_CONTRIBUTION,
} from "@/lib/mock-store";

const STEPS_GENERAL = [
  { id: 1, title: "Profissional" },
  { id: 2, title: "Agendamento" },
  { id: 3, title: "Anamnese" },
  { id: 4, title: "Exames" },
  { id: 5, title: "Avaliação" },
  { id: 6, title: "Contribuição" },
  { id: 7, title: "Confirmação" },
];

const STEPS_PRO = [
  { id: 1, title: "Agendamento" },
  { id: 2, title: "Anamnese" },
  { id: 3, title: "Exames" },
  { id: 4, title: "Avaliação" },
  { id: 5, title: "Contribuição" },
  { id: 6, title: "Confirmação" },
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

export function PortalFlow({
  clinicSlug,
  fixedProfessionalId,
}: {
  clinicSlug: string;
  fixedProfessionalId?: string;
}) {
  const store = useStore();
  const isFixed = !!fixedProfessionalId;
  const STEPS = isFixed ? STEPS_PRO : STEPS_GENERAL;
  const TOTAL = STEPS.length;

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  // Step 0 (geral): área e profissional
  const [areaId, setAreaId] = useState("");
  const [proId, setProId] = useState(fixedProfessionalId ?? "");

  // Step Agendamento
  const [date, setDate] = useState(format(addDays(startOfDay(new Date()), 1), "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");
  const [modality, setModality] = useState<"presencial" | "online">("presencial");

  // Anamnese
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

  // Exames
  const [exams, setExams] = useState<ExamUpload[]>([]);

  // Avaliação
  const [evaluation, setEvaluation] = useState<"dobras" | "bioimpedancia" | "nenhuma">("nenhuma");

  // Contribuição
  const [wantsContribute, setWantsContribute] = useState<"sim" | "nao">("nao");
  const [contribAmount, setContribAmount] = useState<number | "">(MIN_CONTRIBUTION);

  // Mapeia step → tela lógica
  function screen(): string {
    if (isFixed) return ["agendamento", "anamnese", "exames", "avaliacao", "contribuicao", "confirmacao"][step - 1];
    return ["profissional", "agendamento", "anamnese", "exames", "avaliacao", "contribuicao", "confirmacao"][step - 1];
  }

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
    const s = screen();
    if (s === "profissional" && !proId) {
      toast.error("Selecione um profissional");
      return;
    }
    if (s === "anamnese" && (!name.trim() || !phone.trim())) {
      toast.error("Preencha nome e WhatsApp");
      return;
    }
    if (s === "contribuicao" && wantsContribute === "sim") {
      const v = typeof contribAmount === "number" ? contribAmount : 0;
      if (v < MIN_CONTRIBUTION) {
        toast.error(`Valor mínimo R$ ${MIN_CONTRIBUTION}`);
        return;
      }
    }
    setStep((s) => Math.min(TOTAL, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(1, s - 1));
  }

  function confirm() {
    if (!proId) {
      toast.error("Selecione um profissional");
      return;
    }
    const willContribute = wantsContribute === "sim";
    const amount = willContribute && typeof contribAmount === "number" ? contribAmount : undefined;

    const patientId = store.addPatient({
      name,
      phone,
      birthDate: age
        ? new Date(new Date().getFullYear() - Number(age), 0, 1).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      email,
      professionalId: proId,
      isContributor: willContribute,
      contributionAmount: amount,
    });

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

    for (const ex of exams) store.addPatientExam(patientId, ex.name, ex.sizeKb);

    if (willContribute && amount) {
      store.registerContribution(patientId, amount);
    }

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

  if (done) return <Success clinicSlug={clinicSlug} fixedProfessionalId={fixedProfessionalId} />;

  const fixedPro = fixedProfessionalId
    ? store.professionals.find((p) => p.id === fixedProfessionalId)
    : undefined;
  const fixedArea = fixedPro ? store.areas.find((a) => a.id === fixedPro.areaId) : undefined;

  const s = screen();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{store.clinic.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              Portal do paciente · VivaeHub
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Banner profissional fixo */}
        {fixedPro && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border bg-primary/5 border-primary/20 p-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-white font-medium shrink-0"
              style={{ background: fixedPro.color }}
            >
              {fixedPro.name.split(" ").slice(-2).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> Você será atendido por
              </div>
              <div className="font-semibold truncate">{fixedPro.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {fixedPro.specialty} {fixedArea ? `· ${fixedArea.name}` : ""}
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((st, i) => (
              <div key={st.id} className="flex items-center flex-1">
                <div
                  className={
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 " +
                    (step > st.id
                      ? "bg-success text-success-foreground"
                      : step === st.id
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "bg-muted text-muted-foreground")
                  }
                >
                  {step > st.id ? <CheckCircle2 className="h-4 w-4" /> : st.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={"flex-1 h-0.5 mx-1 " + (step > st.id ? "bg-success" : "bg-muted")}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2 text-sm font-medium">
            Etapa {step} de {TOTAL} · {STEPS[step - 1].title}
          </div>
        </div>

        <Card className="p-5 md:p-7 shadow-soft">
          {s === "profissional" && (
            <ScreenProfessional
              areaId={areaId}
              setAreaId={(v) => {
                setAreaId(v);
                setProId("");
              }}
              proId={proId}
              setProId={setProId}
            />
          )}
          {s === "agendamento" && (
            <ScreenAgendamento
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              modality={modality}
              setModality={setModality}
            />
          )}
          {s === "anamnese" && (
            <ScreenAnamnese
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
          {s === "exames" && (
            <ScreenExames exams={exams} setExams={setExams} onFiles={handleFiles} />
          )}
          {s === "avaliacao" && (
            <ScreenAvaliacao evaluation={evaluation} setEvaluation={setEvaluation} />
          )}
          {s === "contribuicao" && (
            <ScreenContribuicao
              wants={wantsContribute}
              setWants={setWantsContribute}
              amount={contribAmount}
              setAmount={setContribAmount}
            />
          )}
          {s === "confirmacao" && (
            <ScreenConfirmacao
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
              wantsContribute={wantsContribute === "sim"}
              contribAmount={typeof contribAmount === "number" ? contribAmount : 0}
            />
          )}
        </Card>

        <div className="flex items-center justify-between mt-5">
          <Button variant="ghost" onClick={prev} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          {step < TOTAL ? (
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

/* ---------- Telas ---------- */

function ScreenProfessional({
  areaId,
  setAreaId,
  proId,
  setProId,
}: {
  areaId: string;
  setAreaId: (v: string) => void;
  proId: string;
  setProId: (v: string) => void;
}) {
  const store = useStore();
  const areasComProfissional = store.areas.filter((a) =>
    store.professionals.some((p) => p.areaId === a.id),
  );
  const profsDaArea = areaId
    ? store.professionals.filter((p) => p.areaId === areaId)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Escolha a área de atendimento</h2>
        <p className="text-sm text-muted-foreground">
          Selecione a especialidade e em seguida o profissional.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {areasComProfissional.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAreaId(a.id)}
            className={
              "rounded-xl border p-4 text-left transition-smooth hover:bg-muted/40 " +
              (areaId === a.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "")
            }
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full mb-2"
              style={{ background: a.color }}
            />
            <div className="font-medium text-sm">{a.name}</div>
          </button>
        ))}
        {areasComProfissional.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground text-center py-6">
            Nenhuma área com profissionais disponíveis.
          </div>
        )}
      </div>

      {areaId && (
        <div className="space-y-2">
          <Label>Profissional</Label>
          <div className="grid grid-cols-1 gap-2">
            {profsDaArea.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProId(p.id)}
                className={
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-smooth hover:bg-muted/40 " +
                  (proId === p.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "")
                }
              >
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ background: p.color }}
                >
                  {p.name.split(" ").slice(-2).map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.specialty}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenAgendamento({
  date,
  setDate,
  time,
  setTime,
  modality,
  setModality,
}: {
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  modality: "presencial" | "online";
  setModality: (v: "presencial" | "online") => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Agende sua consulta</h2>
        <p className="text-sm text-muted-foreground">Escolha dia, horário e modalidade.</p>
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

type AnamneseProps = {
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

function ScreenAnamnese(p: AnamneseProps) {
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

function ScreenExames({
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
        <div className="text-xs text-muted-foreground">{exams.length}/8 anexados</div>
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

function ScreenAvaliacao({
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

function ScreenContribuicao({
  wants,
  setWants,
  amount,
  setAmount,
}: {
  wants: "sim" | "nao";
  setWants: (v: "sim" | "nao") => void;
  amount: number | "";
  setAmount: (v: number | "") => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HeartHandshake className="h-5 w-5 text-primary" /> Contribuição voluntária
        </h2>
        <p className="text-sm text-muted-foreground">
          A contribuição é opcional e ajuda na manutenção dos atendimentos gratuitos.
        </p>
      </div>

      <RadioGroup
        value={wants}
        onValueChange={(v) => setWants(v as "sim" | "nao")}
        className="grid grid-cols-2 gap-2"
      >
        <Choice value="sim" title="Sim, quero contribuir" desc={`A partir de R$ ${MIN_CONTRIBUTION}.`} />
        <Choice value="nao" title="Agora não" desc="Você continua associado normalmente." />
      </RadioGroup>

      {wants === "sim" && (
        <div className="space-y-2 rounded-lg border bg-primary/5 border-primary/20 p-4">
          <Label>Valor mensal (mínimo R$ {MIN_CONTRIBUTION})</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">R$</span>
            <Input
              type="number"
              min={MIN_CONTRIBUTION}
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="max-w-[160px]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[50, 75, 100, 150, 200].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={
                  "px-3 py-1 rounded-full text-xs border transition-smooth " +
                  (amount === v
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted/50")
                }
              >
                R$ {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenConfirmacao(props: {
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
  wantsContribute: boolean;
  contribAmount: number;
}) {
  const store = useStore();
  const pro = store.professionals.find((p) => p.id === props.proId);
  const area = store.areas.find((a) => a.id === pro?.areaId);
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
        <Item
          label="Contribuição"
          value={
            props.wantsContribute ? `R$ ${props.contribAmount}/mês` : "Não contribuinte"
          }
        />
        <Item label="Associado" value="Sim (automático)" />
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

function Success({
  clinicSlug,
  fixedProfessionalId,
}: {
  clinicSlug: string;
  fixedProfessionalId?: string;
}) {
  const store = useStore();
  const pro = fixedProfessionalId
    ? store.professionals.find((p) => p.id === fixedProfessionalId)
    : undefined;
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
        {pro ? (
          <Link
            to="/portal/$slug/$pro"
            params={{ slug: clinicSlug, pro: pro.slug }}
            reloadDocument
            className="inline-flex items-center justify-center gap-2 rounded-md gradient-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-soft"
          >
            Fazer outro agendamento
          </Link>
        ) : (
          <Link
            to="/portal/$slug"
            params={{ slug: clinicSlug }}
            reloadDocument
            className="inline-flex items-center justify-center gap-2 rounded-md gradient-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-soft"
          >
            Fazer outro agendamento
          </Link>
        )}
      </Card>
    </div>
  );
}
