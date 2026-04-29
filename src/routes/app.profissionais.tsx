import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash2, Tag, Link2, Copy, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { isSameDay } from "date-fns";
import { BlockScheduleDialog } from "@/components/block-schedule-dialog";

export const Route = createFileRoute("/app/profissionais")({
  component: Profissionais,
});

function Profissionais() {
  const store = useStore();
  const [openPro, setOpenPro] = useState(false);
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="Profissionais"
        description="Cadastro, áreas de atuação e visão por agenda."
        action={<NewProDialog open={openPro} onOpenChange={setOpenPro} />}
      />

      {/* Áreas configuráveis */}
      <Card className="p-5 shadow-soft mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" /> Áreas de atendimento
            </h3>
            <p className="text-xs text-muted-foreground">
              Cada profissional pertence a uma área. Use as áreas para filtrar agenda e dashboard.
            </p>
          </div>
          <NewAreaInline />
        </div>
        <div className="flex flex-wrap gap-2">
          {store.areas.map((a) => {
            const inUse = store.professionals.some((p) => p.areaId === a.id);
            return (
              <div
                key={a.id}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card text-sm"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: a.color }}
                />
                {a.name}
                <button
                  type="button"
                  disabled={inUse}
                  onClick={() => {
                    const ok = store.removeArea(a.id);
                    if (!ok) toast.error("Área em uso por algum profissional.");
                    else toast.success("Área removida");
                  }}
                  className="opacity-0 group-hover:opacity-100 disabled:opacity-30 transition-smooth"
                  title={inUse ? "Em uso" : "Remover"}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {store.professionals.map((p) => {
          const area = store.areas.find((a) => a.id === p.areaId);
          const todayCount = store.appointments.filter(
            (a) => a.professionalId === p.id && isSameDay(new Date(a.date), today),
          ).length;
          const total = store.appointments.filter((a) => a.professionalId === p.id).length;
          return (
            <Card key={p.id} className="p-5 shadow-soft hover:shadow-elegant transition-smooth">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white font-medium"
                  style={{ background: p.color }}
                >
                  {p.name.split(" ").slice(-2).map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.specialty}</div>
                  {area && (
                    <Badge variant="outline" className="mt-1 text-[10px] py-0 h-4">
                      {area.name}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Hoje</div>
                  <div className="font-semibold">{todayCount}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-semibold">{total}</div>
                </div>
              </div>
              <PortalLink clinicSlug={store.clinic.slug} proSlug={p.slug} />
            <BlockScheduleDialog
              professionalId={p.id}
              lockProfessional
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  <CalendarOff className="h-3.5 w-3.5 mr-1" /> Bloquear agenda
                </Button>
              }
            />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PortalLink({ clinicSlug, proSlug }: { clinicSlug: string; proSlug: string }) {
  const path = `/portal/${clinicSlug}/${proSlug}`;
  const fullUrl =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  function copy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      toast.success("Link copiado");
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
      <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="truncate flex-1 font-mono text-[11px]">{path}</span>
      <button
        type="button"
        onClick={copy}
        className="text-muted-foreground hover:text-primary transition-smooth shrink-0"
        title="Copiar link"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function NewAreaInline() {
  const store = useStore();
  const [name, setName] = useState("");

  function add() {
    if (!name.trim()) return;
    store.addArea(name.trim());
    setName("");
    toast.success("Área criada");
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Nova área (ex: Podologia)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        className="h-8 w-44 text-sm"
      />
      <Button size="sm" variant="outline" onClick={add}>
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

function NewProDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const store = useStore();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [areaId, setAreaId] = useState(store.areas[0]?.id ?? "");
  const [slug, setSlug] = useState("");

  const autoSlug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!areaId) {
      toast.error("Cadastre uma área primeiro");
      return;
    }
    store.addProfessional({ name, specialty, areaId, slug: slug.trim() || autoSlug });
    toast.success("Profissional cadastrado");
    onOpenChange(false);
    setName("");
    setSpecialty("");
    setSlug("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Novo profissional
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo profissional</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Especialidade (cargo)</Label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Área de atuação</Label>
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a área" />
              </SelectTrigger>
              <SelectContent>
                {store.areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Slug do portal (URL)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={autoSlug || "ex: marina-costa"}
            />
            <p className="text-xs text-muted-foreground">
              Usado em /portal/{store.clinic.slug}/<strong>{slug || autoSlug || "slug"}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-primary">Cadastrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
