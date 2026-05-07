import { useStore } from "@/hooks/use-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasProAccess } from "@/lib/plan";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Bell,
  Clock,
  Target,
  CalendarX,
  PieChart,
  Lightbulb,
} from "lucide-react";
import { isSameMonth, subMonths, isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";

function ProBadge() {
  return (
    <Badge className="gradient-primary text-primary-foreground border-0 text-[10px] h-5">
      <Sparkles className="h-3 w-3 mr-1" /> Pro
    </Badge>
  );
}

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ============ AGENDA ============ */
export function AgendaProInsights() {
  const store = useStore();
  if (!hasProAccess(store.clinic)) return null;

  const now = new Date();
  const last30 = store.appointments.filter(
    (a) => +new Date(a.date) >= +now - 1000 * 60 * 60 * 24 * 30,
  );
  const total = last30.length || 1;
  const noShow = last30.filter((a) => a.status === "cancelado").length;
  const noShowPct = Math.round((noShow / total) * 100);

  // Ocupação: slots de 45min entre 8h–18h * 5 dias úteis * profissionais
  const proCount = Math.max(1, store.professionals.length);
  const slotsWeek = proCount * 5 * Math.floor((10 * 60) / 45);
  const weekAppts = store.appointments.filter(
    (a) => +new Date(a.date) >= +now - 1000 * 60 * 60 * 24 * 7,
  ).length;
  const occPct = Math.min(100, Math.round((weekAppts / slotsWeek) * 100));

  // Tempo médio entre consultas (mesmo profissional)
  const sorted = [...store.appointments].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const gaps: number[] = [];
  const lastByPro: Record<string, number> = {};
  sorted.forEach((a) => {
    const t = +new Date(a.date);
    const prev = lastByPro[a.professionalId];
    if (prev) gaps.push((t - prev) / (1000 * 60));
    lastByPro[a.professionalId] = t;
  });
  const avgGap = gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;

  // Dias com baixa ocupação
  const dayCount: Record<number, number> = {};
  last30.forEach((a) => {
    const d = new Date(a.date).getDay();
    dayCount[d] = (dayCount[d] || 0) + 1;
  });
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const lowDay = Object.entries(dayCount).sort((a, b) => a[1] - b[1])[0];
  const lowDayLabel = lowDay ? dayNames[Number(lowDay[0])] : "—";

  return (
    <Card className="p-5 shadow-soft mb-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Insights da agenda</h3>
        <ProBadge />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Metric icon={CalendarX} label="Taxa de faltas" value={`${noShowPct}%`} tone={noShowPct > 15 ? "warn" : "ok"} />
        <Metric icon={PieChart} label="Ocupação semanal" value={`${occPct}%`} tone={occPct < 40 ? "warn" : "ok"} />
        <Metric icon={Clock} label="Tempo médio entre consultas" value={`${avgGap} min`} />
        <Metric icon={Lightbulb} label="Dia mais ocioso" value={lowDayLabel} hint="Sugira promoções" />
        <Metric icon={Bell} label="Lembretes automáticos" value="Ativo" tone="ok" />
      </div>
    </Card>
  );
}

/* ============ FINANCEIRO ============ */
export function FinanceProInsights() {
  const store = useStore();
  if (!hasProAccess(store.clinic)) return null;

  const now = new Date();
  const prev = subMonths(now, 1);
  const monthRev = store.finance
    .filter((e) => isSameMonth(new Date(e.date), now))
    .reduce((s, e) => s + e.amount, 0);
  const prevRev = store.finance
    .filter((e) => isSameMonth(new Date(e.date), prev))
    .reduce((s, e) => s + e.amount, 0);
  const delta = prevRev ? Math.round(((monthRev - prevRev) / prevRev) * 100) : 0;
  const up = delta >= 0;

  // Receita por profissional (via consultas do mês)
  const monthAppts = store.appointments.filter((a) => isSameMonth(new Date(a.date), now));
  const byPro = store.professionals
    .map((p) => {
      const count = monthAppts.filter((a) => a.professionalId === p.id).length;
      // Estimativa: receita por consulta = média da clínica
      const avgTicket = monthAppts.length ? monthRev / monthAppts.length : 0;
      return { name: p.name, value: count * avgTicket };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const expenses = store.finance
    .filter((e) => e.type === "despesa" && isSameMonth(new Date(e.date), now))
    .reduce((s, e) => s + e.amount, 0);
  const profit = monthRev - expenses;

  return (
    <Card className="p-5 shadow-soft mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Insights financeiros</h3>
        <ProBadge />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Receita mensal</div>
          <div className="text-2xl font-semibold tabular-nums mt-1">{fmtBRL(monthRev)}</div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${up ? "text-success" : "text-destructive"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta >= 0 ? "+" : ""}{delta}% vs {format(prev, "MMM", { locale: ptBR })}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Lucro estimado</div>
          <div className={`text-2xl font-semibold tabular-nums mt-1 ${profit >= 0 ? "" : "text-destructive"}`}>
            {fmtBRL(profit)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Despesas: {fmtBRL(expenses)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Top profissionais (mês)</div>
          {byPro.length === 0 && <div className="text-xs text-muted-foreground">Sem dados.</div>}
          {byPro.map((b) => (
            <div key={b.name} className="flex items-center justify-between text-sm py-0.5">
              <span className="truncate">{b.name}</span>
              <span className="tabular-nums font-medium">{fmtBRL(b.value)}</span>
            </div>
          ))}
        </div>
      </div>
      {delta < -10 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Queda de faturamento detectada ({delta}% em relação ao mês anterior).
        </div>
      )}
    </Card>
  );
}

/* ============ DASHBOARD ============ */
export function DashboardProInsights() {
  const store = useStore();
  if (!hasProAccess(store.clinic)) return null;

  const now = new Date();
  const last30 = store.appointments.filter(
    (a) => +new Date(a.date) >= +now - 1000 * 60 * 60 * 24 * 30,
  );
  const prev30 = store.appointments.filter((a) => {
    const t = +new Date(a.date);
    return t < +now - 1000 * 60 * 60 * 24 * 30 && t >= +now - 1000 * 60 * 60 * 24 * 60;
  });

  const noShow30 = last30.filter((a) => a.status === "cancelado").length;
  const noShowPrev = prev30.filter((a) => a.status === "cancelado").length;
  const noShowDelta =
    noShowPrev > 0 ? Math.round(((noShow30 - noShowPrev) / noShowPrev) * 100) : 0;

  const growth =
    prev30.length > 0
      ? Math.round(((last30.length - prev30.length) / prev30.length) * 100)
      : 0;

  // Dia com menor ocupação
  const dayCount: Record<number, number> = {};
  last30.forEach((a) => {
    const d = new Date(a.date).getDay();
    dayCount[d] = (dayCount[d] || 0) + 1;
  });
  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const sortedDays = Object.entries(dayCount).sort((a, b) => a[1] - b[1]);
  const lowDay = sortedDays[0] ? dayNames[Number(sortedDays[0][0])] : null;
  const highDay = sortedDays[sortedDays.length - 1]
    ? dayNames[Number(sortedDays[sortedDays.length - 1][0])]
    : null;

  // Profissional com menor taxa de retorno (menos consultas no período)
  const proCounts = store.professionals.map((p) => ({
    name: p.name,
    count: last30.filter((a) => a.professionalId === p.id).length,
  }));
  const lowestPro = proCounts.sort((a, b) => a.count - b.count)[0];

  const insights: { icon: typeof Sparkles; text: string; tone?: "ok" | "warn" }[] = [];

  if (noShowDelta !== 0)
    insights.push({
      icon: noShowDelta > 0 ? AlertTriangle : Activity,
      text: `Sua taxa de faltas ${noShowDelta > 0 ? "aumentou" : "caiu"} ${Math.abs(noShowDelta)}% no último mês.`,
      tone: noShowDelta > 0 ? "warn" : "ok",
    });

  if (lowDay)
    insights.push({
      icon: CalendarX,
      text: `${lowDay} tem a menor ocupação. Considere campanhas nesse dia.`,
    });

  if (growth !== 0)
    insights.push({
      icon: growth > 0 ? TrendingUp : TrendingDown,
      text: `Sua clínica ${growth > 0 ? "cresceu" : "reduziu"} ${Math.abs(growth)}% em volume de consultas no mês.`,
      tone: growth > 0 ? "ok" : "warn",
    });

  if (lowestPro && lowestPro.count > 0)
    insights.push({
      icon: AlertTriangle,
      text: `${lowestPro.name} tem o menor número de consultas no período (${lowestPro.count}).`,
      tone: "warn",
    });

  if (highDay)
    insights.push({
      icon: Target,
      text: `Sugestão: aumentar horários em ${highDay}, dia com maior demanda.`,
    });

  if (insights.length === 0) return null;

  return (
    <Card className="p-5 shadow-soft mt-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Insights inteligentes</h3>
        <ProBadge />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {insights.map((i, idx) => {
          const Icon = i.icon;
          const cls =
            i.tone === "warn"
              ? "border-warning/30 bg-warning/5 text-foreground"
              : i.tone === "ok"
              ? "border-success/30 bg-success/5 text-foreground"
              : "border-border bg-card";
          const iconCls =
            i.tone === "warn" ? "text-warning" : i.tone === "ok" ? "text-success" : "text-primary";
          return (
            <div key={idx} className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${cls}`}>
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconCls}`} />
              <span>{i.text}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ============ shared metric tile ============ */
function Metric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn";
}) {
  const valueCls = tone === "warn" ? "text-warning" : tone === "ok" ? "text-success" : "";
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`text-xl font-semibold mt-1 tabular-nums ${valueCls}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}