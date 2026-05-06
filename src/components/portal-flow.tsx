import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/hooks/use-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Activity,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HeartHandshake,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  CONDITION_LABEL,
  CONTRIBUTION_AMOUNT,
  CONTRIBUTION_TEXT,
  DIABETES_TYPE_LABEL,
  LGPD_TEXT,
  type PatientHealth,
  type PatientPersonal,
} from "@/lib/mock-store";

const STEPS_GENERAL = [
  { id: 1, title: "Profissional" },
  { id: 2, title: "Cadastro" },
  { id: 3, title: "Saúde" },
  { id: 4, title: "Agendamento" },
  { id: 5, title: "Termos" },
  { id: 6, title: "Confirmação" },
];

const STEPS_PRO = [
  { id: 1, title: "Cadastro" },
  { id: 2, title: "Saúde" },
  { id: 3, title: "Agendamento" },
  { id: 4, title: "Termos" },
  { id: 5, title: "Confirmação" },
];

type Conditions = PatientHealth["conditions"];

const EMPTY_CONDITIONS: Conditions = {
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

  // Profissional
  const [areaId, setAreaId] = useState("");
  const [proId, setProId] = useState(fixedProfessionalId ?? "");

  // Sincroniza profissional pré-selecionado quando os dados do portal
  // hidratarem após a montagem (caso a URL traga /portal/$slug/$pro).
  useEffect(() => {
    if (fixedProfessionalId && fixedProfessionalId !== proId) {
      setProId(fixedProfessionalId);
      const pro = store.professionals.find((p) => p.id === fixedProfessionalId);
      if (pro) setAreaId(pro.areaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedProfessionalId, store.professionals.length]);

  // Cadastro APAD — pessoais
  const [name, setName] = useState("");
  const [rg, setRg] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [profession, setProfession] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [num, setNum] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  // Contato
  const [landline, setLandline] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Saúde APAD
  const [howKnew, setHowKnew] = useState("");
  const [diagnosisYear, setDiagnosisYear] = useState("");
  const [diabetesType, setDiabetesType] = useState<PatientHealth["diabetesType"]>("tipo1");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState<Conditions>(EMPTY_CONDITIONS);

  // Agendamento
  const [date, setDate] = useState(format(addDays(startOfDay(new Date()), 1), "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");
  const [modality, setModality] = useState<"presencial" | "online">("presencial");

  // Termos
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [contributeConsent, setContributeConsent] = useState(false);

  function screen(): string {
    const seq = isFixed
      ? ["cadastro", "saude", "agendamento", "termos", "confirmacao"]
      : ["profissional", "cadastro", "saude", "agendamento", "termos", "confirmacao"];
    return seq[step - 1] ?? "confirmacao";
  }

  function next() {
    const s = screen();
    if (s === "profissional" && !proId) {
      toast.error("Selecione um profissional");
      return;
    }
    if (s === "cadastro") {
      if (!name.trim() || !phone.trim() || !birthDate) {
        toast.error("Preencha nome, data de nascimento e celular");
        return;
      }
    }
    if (s === "agendamento") {
      const iso = new Date(`${date}T${time}:00`).toISOString();
      if (store.isBlocked(proId, iso, 45)) {
        toast.error("Horário indisponível — escolha outro");
        return;
      }
    }
    if (s === "termos" && !lgpdConsent) {
      toast.error("É necessário aceitar o termo de uso de dados (LGPD)");
      return;
    }
    setStep((v) => Math.min(TOTAL, v + 1));
  }
  function prev() {
    setStep((v) => Math.max(1, v - 1));
  }

  function confirm() {
    if (!proId) {
      toast.error("Profissional não selecionado");
      return;
    }
    const personal: PatientPersonal = {
      rg, cpf, cep, street, number: num, complement, district, city, state: stateUf,
      profession, landline,
    };
    const health: PatientHealth = {
      howKnewAssociation: howKnew,
      diagnosisYear,
      diabetesType,
      medications,
      conditions,
    };
    const patientId = store.addPatient({
      name,
      phone,
      birthDate,
      email: email || undefined,
      personal,
      health,
      professionalId: proId,
      isContributor: contributeConsent,
      contributionAmount: contributeConsent ? CONTRIBUTION_AMOUNT : undefined,
      lgptConsent: lgpdConsent,
    });

    const iso = new Date(`${date}T${time}:00`).toISOString();
    const apptId = store.addAppointment({
      patientId,
      professionalId: proId,
      date: iso,
      durationMin: 45,
      status: "pendente",
      modality,
    });
    if (!apptId) {
      toast.error("Horário indisponível — selecione outro horário.");
      return;
    }
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
              setAreaId={(v) => { setAreaId(v); setProId(""); }}
              proId={proId}
              setProId={setProId}
            />
          )}
          {s === "cadastro" && (
            <ScreenCadastro
              v={{
                name, setName, rg, setRg, cpf, setCpf, birthDate, setBirthDate, profession, setProfession,
                cep, setCep, street, setStreet, num, setNum, complement, setComplement,
                district, setDistrict, city, setCity, stateUf, setStateUf,
                landline, setLandline, phone, setPhone, email, setEmail,
              }}
            />
          )}
          {s === "saude" && (
            <ScreenSaude
              howKnew={howKnew} setHowKnew={setHowKnew}
              diagnosisYear={diagnosisYear} setDiagnosisYear={setDiagnosisYear}
              diabetesType={diabetesType} setDiabetesType={setDiabetesType}
              medications={medications} setMedications={setMedications}
              conditions={conditions} setConditions={setConditions}
            />
          )}
          {s === "agendamento" && (
            <ScreenAgendamento
              proId={proId}
              date={date} setDate={setDate}
              time={time} setTime={setTime}
              modality={modality} setModality={setModality}
            />
          )}
          {s === "termos" && (
            <ScreenTermos
              lgpdConsent={lgpdConsent} setLgpdConsent={setLgpdConsent}
              contributeConsent={contributeConsent} setContributeConsent={setContributeConsent}
            />
          )}
          {s === "confirmacao" && (
            <ScreenConfirmacao
              proId={proId}
              date={date} time={time} modality={modality}
              name={name} contributeConsent={contributeConsent}
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
  areaId, setAreaId, proId, setProId,
}: {
  areaId: string; setAreaId: (v: string) => void; proId: string; setProId: (v: string) => void;
}) {
  const store = useStore();
  const grouped = store.areas
    .map((a) => ({ area: a, profs: store.professionals.filter((p) => p.areaId === a.id) }))
    .filter((g) => g.profs.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="space-y-3 text-center py-8">
        <h2 className="text-xl font-semibold">Sem áreas disponíveis</h2>
        <p className="text-sm text-muted-foreground">
          Esta clínica ainda não possui profissionais cadastrados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Escolha a área de atendimento</h2>
        <p className="text-sm text-muted-foreground">
          Áreas disponíveis em {store.clinic.name}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAreaId("")}
          className={
            "px-3 py-1.5 rounded-full border text-xs font-medium transition-smooth " +
            (areaId === "" ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/40")
          }
        >
          Todas ({grouped.length})
        </button>
        {grouped.map(({ area, profs }) => (
          <button
            key={area.id}
            type="button"
            onClick={() => setAreaId(area.id)}
            className={
              "px-3 py-1.5 rounded-full border text-xs font-medium transition-smooth flex items-center gap-1.5 " +
              (areaId === area.id ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/40")
            }
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: area.color }} />
            {area.name} ({profs.length})
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {grouped.filter(({ area }) => !areaId || area.id === areaId).map(({ area, profs }) => (
          <div key={area.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: area.color }} />
              <h3 className="text-sm font-semibold">{area.name}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {profs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setAreaId(area.id); setProId(p.id); }}
                  className={
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-smooth hover:bg-muted/40 " +
                    (proId === p.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "")
                  }
                >
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
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
        ))}
      </div>
    </div>
  );
}

type CadastroVals = {
  name: string; setName: (v: string) => void;
  rg: string; setRg: (v: string) => void;
  cpf: string; setCpf: (v: string) => void;
  birthDate: string; setBirthDate: (v: string) => void;
  profession: string; setProfession: (v: string) => void;
  cep: string; setCep: (v: string) => void;
  street: string; setStreet: (v: string) => void;
  num: string; setNum: (v: string) => void;
  complement: string; setComplement: (v: string) => void;
  district: string; setDistrict: (v: string) => void;
  city: string; setCity: (v: string) => void;
  stateUf: string; setStateUf: (v: string) => void;
  landline: string; setLandline: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
};

function ScreenCadastro({ v }: { v: CadastroVals }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dados pessoais</h2>
        <p className="text-sm text-muted-foreground">
          Esses dados ficam no seu cadastro e prontuário (formulário oficial APAD).
        </p>
      </div>

      <Section title="Identificação">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome completo *" className="sm:col-span-2">
            <Input value={v.name} onChange={(e) => v.setName(e.target.value)} />
          </Field>
          <Field label="RG"><Input value={v.rg} onChange={(e) => v.setRg(e.target.value)} /></Field>
          <Field label="CPF"><Input value={v.cpf} onChange={(e) => v.setCpf(e.target.value)} /></Field>
          <Field label="Data de nascimento *">
            <Input type="date" value={v.birthDate} onChange={(e) => v.setBirthDate(e.target.value)} />
          </Field>
          <Field label="Profissão"><Input value={v.profession} onChange={(e) => v.setProfession(e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Endereço">
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <Field label="CEP" className="sm:col-span-2"><Input value={v.cep} onChange={(e) => v.setCep(e.target.value)} /></Field>
          <Field label="Rua" className="sm:col-span-3"><Input value={v.street} onChange={(e) => v.setStreet(e.target.value)} /></Field>
          <Field label="Número" className="sm:col-span-1"><Input value={v.num} onChange={(e) => v.setNum(e.target.value)} /></Field>
          <Field label="Complemento" className="sm:col-span-3"><Input value={v.complement} onChange={(e) => v.setComplement(e.target.value)} /></Field>
          <Field label="Bairro" className="sm:col-span-3"><Input value={v.district} onChange={(e) => v.setDistrict(e.target.value)} /></Field>
          <Field label="Cidade" className="sm:col-span-4"><Input value={v.city} onChange={(e) => v.setCity(e.target.value)} /></Field>
          <Field label="UF" className="sm:col-span-2"><Input maxLength={2} value={v.stateUf} onChange={(e) => v.setStateUf(e.target.value.toUpperCase())} /></Field>
        </div>
      </Section>

      <Section title="Contato">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Telefone fixo"><Input value={v.landline} onChange={(e) => v.setLandline(e.target.value)} /></Field>
          <Field label="Celular *"><Input value={v.phone} onChange={(e) => v.setPhone(e.target.value)} /></Field>
          <Field label="E-mail"><Input type="email" value={v.email} onChange={(e) => v.setEmail(e.target.value)} /></Field>
        </div>
      </Section>
    </div>
  );
}

function ScreenSaude({
  howKnew, setHowKnew, diagnosisYear, setDiagnosisYear, diabetesType, setDiabetesType,
  medications, setMedications, conditions, setConditions,
}: {
  howKnew: string; setHowKnew: (v: string) => void;
  diagnosisYear: string; setDiagnosisYear: (v: string) => void;
  diabetesType: PatientHealth["diabetesType"]; setDiabetesType: (v: PatientHealth["diabetesType"]) => void;
  medications: string; setMedications: (v: string) => void;
  conditions: Conditions; setConditions: (v: Conditions) => void;
}) {
  function toggle(k: keyof Conditions, val: boolean) {
    setConditions({ ...conditions, [k]: val });
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dados de saúde</h2>
        <p className="text-sm text-muted-foreground">Estas informações alimentam seu prontuário clínico.</p>
      </div>

      <Section title="Sobre o diabetes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Como conheceu a associação?" className="sm:col-span-2">
            <Input value={howKnew} onChange={(e) => setHowKnew(e.target.value)} />
          </Field>
          <Field label="Ano do diagnóstico">
            <Input value={diagnosisYear} onChange={(e) => setDiagnosisYear(e.target.value)} placeholder="Ex: 2018" />
          </Field>
          <Field label="Tipo de diabetes">
            <Select value={diabetesType} onValueChange={(val) => setDiabetesType(val as PatientHealth["diabetesType"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(DIABETES_TYPE_LABEL).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Medicamentos em uso" className="sm:col-span-2">
            <Textarea value={medications} onChange={(e) => setMedications(e.target.value)} rows={2} />
          </Field>
        </div>
      </Section>

      <Section title="Condições (marque o que se aplica)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(CONDITION_LABEL) as Array<keyof Conditions>).map((k) => (
            <label key={k} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
              <Checkbox checked={conditions[k]} onCheckedChange={(v) => toggle(k, !!v)} />
              <span className="text-sm">{CONDITION_LABEL[k]}</span>
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ScreenAgendamento({
  proId, date, setDate, time, setTime, modality, setModality,
}: {
  proId: string;
  date: string; setDate: (v: string) => void;
  time: string; setTime: (v: string) => void;
  modality: "presencial" | "online"; setModality: (v: "presencial" | "online") => void;
}) {
  const store = useStore();

  // Lista de horários sugeridos no dia (slots a cada 30min entre 8h e 18h)
  const slots = useMemo(() => {
    const out: string[] = [];
    for (let h = 8; h < 18; h++) {
      out.push(`${String(h).padStart(2, "0")}:00`);
      out.push(`${String(h).padStart(2, "0")}:30`);
    }
    return out;
  }, []);

  function isSlotBlocked(t: string): boolean {
    if (!proId) return false;
    return store.isBlocked(proId, new Date(`${date}T${t}:00`).toISOString(), 45);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Agende sua consulta</h2>
        <p className="text-sm text-muted-foreground">
          Escolha dia, horário e modalidade. Horários indisponíveis estão acinzentados.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Modalidade">
          <RadioGroup
            value={modality}
            onValueChange={(v) => setModality(v as "presencial" | "online")}
            className="grid grid-cols-2 gap-2"
          >
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 text-sm">
              <RadioGroupItem value="presencial" /> Presencial
            </label>
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 text-sm">
              <RadioGroupItem value="online" /> Online
            </label>
          </RadioGroup>
        </Field>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Horário</Label>
        <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
          {slots.map((s) => {
            const blocked = isSlotBlocked(s);
            const active = time === s;
            return (
              <button
                key={s}
                type="button"
                disabled={blocked}
                onClick={() => setTime(s)}
                className={
                  "rounded-lg border px-2 py-2 text-sm transition-smooth tabular-nums " +
                  (blocked
                    ? "bg-muted/40 text-muted-foreground line-through cursor-not-allowed"
                    : active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted/40")
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScreenTermos({
  lgpdConsent, setLgpdConsent, contributeConsent, setContributeConsent,
}: {
  lgpdConsent: boolean; setLgpdConsent: (v: boolean) => void;
  contributeConsent: boolean; setContributeConsent: (v: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Termos e consentimento
        </h2>
        <p className="text-sm text-muted-foreground">
          Leia atentamente antes de finalizar.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/30">
        <Checkbox checked={lgpdConsent} onCheckedChange={(v) => setLgpdConsent(!!v)} />
        <div className="text-sm leading-relaxed">
          <strong>LGPD *</strong>
          <div className="text-muted-foreground mt-1">{LGPD_TEXT}</div>
        </div>
      </label>

      <label className="flex items-start gap-3 rounded-lg border bg-primary/5 border-primary/20 p-4 cursor-pointer hover:bg-primary/10">
        <Checkbox checked={contributeConsent} onCheckedChange={(v) => setContributeConsent(!!v)} />
        <div className="text-sm leading-relaxed">
          <div className="flex items-center gap-2 font-medium">
            <HeartHandshake className="h-4 w-4 text-primary" /> Contribuição voluntária
          </div>
          <div className="text-muted-foreground mt-1">{CONTRIBUTION_TEXT}</div>
        </div>
      </label>
    </div>
  );
}

function ScreenConfirmacao({
  proId, date, time, modality, name, contributeConsent,
}: {
  proId: string; date: string; time: string;
  modality: "presencial" | "online"; name: string; contributeConsent: boolean;
}) {
  const store = useStore();
  const pro = store.professionals.find((p) => p.id === proId);
  const area = store.areas.find((a) => a.id === pro?.areaId);
  const dateObj = new Date(`${date}T${time}:00`);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Confira e confirme</h2>
        <p className="text-sm text-muted-foreground">Revise os dados antes de enviar à clínica.</p>
      </div>

      <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarCheck className="h-4 w-4 text-primary" /> Sua consulta
        </div>
        <div className="text-sm">
          {format(dateObj, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          <span className="text-muted-foreground"> · {modality}</span>
        </div>
        {pro && (
          <div className="flex items-center gap-3 pt-2 border-t border-primary/15">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
              style={{ background: pro.color }}
            >
              {pro.name.split(" ").slice(-2).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Profissional</div>
              <div className="text-sm font-semibold truncate">{pro.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {pro.specialty}{area ? ` · ${area.name}` : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Item label="Paciente" value={name || "—"} />
        <Item label="Modalidade" value={modality} />
        <Item label="Associado" value="Sim (automático)" />
        <Item label="Contribuição" value={contributeConsent ? `R$ ${CONTRIBUTION_AMOUNT},00/mês` : "Não optou"} />
      </div>

      <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/40 border">
        Ao confirmar, criamos automaticamente seu cadastro, agendamento e prontuário.
        Você receberá uma confirmação no WhatsApp.
      </div>
    </div>
  );
}

function Success({
  clinicSlug, fixedProfessionalId,
}: {
  clinicSlug: string; fixedProfessionalId?: string;
}) {
  const store = useStore();
  const pro = fixedProfessionalId ? store.professionals.find((p) => p.id === fixedProfessionalId) : undefined;
  const area = pro ? store.areas.find((a) => a.id === pro.areaId) : undefined;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center shadow-soft">
        <div className="mx-auto h-14 w-14 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-4">
          <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Tudo certo!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recebemos seu agendamento. Em instantes você receberá uma confirmação por WhatsApp.
        </p>
        {pro && (
          <div className="mt-5 rounded-lg border bg-muted/30 p-4 text-left">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Profissional</div>
            <div className="text-sm font-semibold">{pro.name}</div>
            <div className="text-xs text-muted-foreground">{pro.specialty}{area ? ` · ${area.name}` : ""}</div>
          </div>
        )}
        <a
          href={fixedProfessionalId ? `/portal/${clinicSlug}/${pro?.slug ?? ""}` : `/portal/${clinicSlug}`}
          className="text-xs text-primary hover:underline mt-6 inline-block"
        >
          Fazer outro agendamento
        </a>
      </Card>
    </div>
  );
}

/* ---------- Helpers ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
