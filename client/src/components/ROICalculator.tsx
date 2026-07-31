import { useState, useMemo } from "react";
import { TrendingDown, DollarSign, Users, ArrowRight, Zap, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <span className="text-sm font-black text-primary tabular-nums">{format(value)}</span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-1.5 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-500 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Custos de referência dos métodos tradicionais ────────────────────────────
const HEADHUNTER_COST_PER_REP = 5000;   // média R$3k–R$8k
const LINKEDIN_RECRUITER_MONTHLY = 1200; // LinkedIn Recruiter Lite ~R$1.200/mês
const WHATSAPP_HOURS_PER_REP = 6;        // horas gastas garimpando
const HOURLY_RATE = 80;                  // custo hora de um gestor/vendedor

export default function ROICalculator() {
  const [, navigate] = useLocation();

  // Sliders
  const [repsPerMonth, setRepsPerMonth] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(80);
  const [method, setMethod] = useState<"headhunter" | "linkedin" | "whatsapp">("headhunter");

  const calc = useMemo(() => {
    const repMatchCost = repsPerMonth * 29;

    let traditionalCost = 0;
    let traditionalLabel = "";
    let traditionalBreakdown: { label: string; value: number }[] = [];

    if (method === "headhunter") {
      traditionalCost = repsPerMonth * HEADHUNTER_COST_PER_REP;
      traditionalLabel = "Headhunter / Agência";
      traditionalBreakdown = [
        { label: `${repsPerMonth} contratações × R$5.000 (média)`, value: traditionalCost },
      ];
    } else if (method === "linkedin") {
      const monthlyFee = LINKEDIN_RECRUITER_MONTHLY;
      const timeWasted = repsPerMonth * 3 * hourlyRate; // 3h por rep no LinkedIn
      traditionalCost = monthlyFee + timeWasted;
      traditionalLabel = "LinkedIn Recruiter";
      traditionalBreakdown = [
        { label: "Mensalidade LinkedIn Recruiter Lite", value: monthlyFee },
        { label: `${repsPerMonth} reps × 3h × ${formatBRL(hourlyRate)}/h (tempo)`, value: timeWasted },
      ];
    } else {
      const timeWasted = repsPerMonth * WHATSAPP_HOURS_PER_REP * hourlyRate;
      const noShowRate = 0.4; // 40% não respondem
      const extraReps = Math.ceil(repsPerMonth * (1 + noShowRate));
      traditionalCost = extraReps * WHATSAPP_HOURS_PER_REP * hourlyRate;
      traditionalLabel = "Grupos de WhatsApp";
      traditionalBreakdown = [
        { label: `${extraReps} contatos necessários (40% não respondem)`, value: 0 },
        { label: `${extraReps} × 6h × ${formatBRL(hourlyRate)}/h (tempo gasto)`, value: traditionalCost },
      ];
    }

    const savings = traditionalCost - repMatchCost;
    const roi = repMatchCost > 0 ? ((savings / repMatchCost) * 100) : 0;
    const timeSavedHours = method === "whatsapp"
      ? repsPerMonth * WHATSAPP_HOURS_PER_REP
      : method === "linkedin"
      ? repsPerMonth * 3
      : repsPerMonth * 8; // tempo de processo com headhunter

    return { repMatchCost, traditionalCost, traditionalLabel, traditionalBreakdown, savings, roi, timeSavedHours };
  }, [repsPerMonth, hourlyRate, method]);

  const savingsPct = calc.traditionalCost > 0
    ? Math.round((calc.savings / calc.traditionalCost) * 100)
    : 0;

  return (
    <section className="py-24 px-6 border-y border-border bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">
            Calculadora de ROI
          </Badge>
          <h2
            className="text-4xl md:text-5xl font-black text-foreground mb-4"
            style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
          >
            Quanto você está{" "}
            <span className="text-gradient-green">desperdiçando</span>
            <br />
            com o método errado?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Ajuste os parâmetros abaixo e veja em tempo real quanto o RepMatch economiza em comparação com métodos tradicionais.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* ── Painel de controles ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card p-8 space-y-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Comparar com qual método?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "headhunter", label: "Headhunter", icon: "🕵️" },
                    { key: "linkedin", label: "LinkedIn", icon: "💼" },
                    { key: "whatsapp", label: "WhatsApp", icon: "📱" },
                  ] as const
                ).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setMethod(key)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                      method === key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <SliderInput
              label="Representantes que precisa contratar por mês"
              value={repsPerMonth}
              min={1}
              max={30}
              step={1}
              onChange={setRepsPerMonth}
              format={(v) => `${v} rep${v > 1 ? "s" : ""}`}
              hint="Quantos representantes você busca por mês em média?"
            />

            {method !== "headhunter" && (
              <SliderInput
                label="Custo/hora do seu tempo (ou do gestor responsável)"
                value={hourlyRate}
                min={30}
                max={300}
                step={10}
                onChange={setHourlyRate}
                format={formatBRL}
                hint="Valor hora de quem faz o recrutamento internamente"
              />
            )}

            {/* Breakdown do método tradicional */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">
                Custo com {calc.traditionalLabel}
              </p>
              <div className="space-y-2">
                {calc.traditionalBreakdown.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-muted-foreground leading-snug">{item.label}</span>
                    {item.value > 0 && (
                      <span className="font-bold text-red-400 whitespace-nowrap tabular-nums">
                        {formatBRL(item.value)}
                      </span>
                    )}
                  </div>
                ))}
                <div className="pt-2 border-t border-red-500/20 flex items-center justify-between">
                  <span className="text-sm font-bold text-red-400">Total mensal</span>
                  <span className="text-xl font-black text-red-400 tabular-nums">
                    {formatBRL(calc.traditionalCost)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Painel de resultados ────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Card principal — economia */}
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-primary uppercase tracking-widest">
                    Você economiza
                  </span>
                </div>
                <div
                  className="text-5xl md:text-6xl font-black text-primary mb-1 tabular-nums"
                  style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
                >
                  {formatBRL(Math.max(0, calc.savings))}
                </div>
                <p className="text-muted-foreground text-sm">
                  por mês em relação ao {calc.traditionalLabel}
                </p>

                {/* Barra de comparação */}
                <div className="mt-6 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-medium">{calc.traditionalLabel}</span>
                      <span className="font-bold text-red-400">{formatBRL(calc.traditionalCost)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-red-500/20 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 w-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-medium">RepMatch</span>
                      <span className="font-bold text-primary">{formatBRL(calc.repMatchCost)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-primary/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{
                          width: calc.traditionalCost > 0
                            ? `${Math.max(4, (calc.repMatchCost / calc.traditionalCost) * 100)}%`
                            : "4%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards secundários */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
                <div
                  className="text-2xl font-black text-foreground tabular-nums"
                  style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
                >
                  {formatBRL(calc.repMatchCost)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Custo RepMatch</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
                <div
                  className="text-2xl font-black text-primary tabular-nums"
                  style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
                >
                  {savingsPct}%
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Mais barato</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-2" />
                <div
                  className="text-2xl font-black text-foreground tabular-nums"
                  style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
                >
                  {calc.timeSavedHours}h
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Horas poupadas</p>
              </div>
            </div>

            {/* Projeção anual */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                  Projeção anual
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-black text-amber-600 tabular-nums"
                  style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
                >
                  {formatBRL(Math.max(0, calc.savings) * 12)}
                </span>
                <span className="text-sm text-muted-foreground">economizados em 12 meses</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Baseado em {repsPerMonth} rep{repsPerMonth > 1 ? "s" : ""}/mês × 12 meses
              </p>
            </div>

            {/* CTA */}
            <Button
              onClick={() => navigate("/register")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-5 rounded-xl shadow-lg"
            >
              Começar a economizar agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Sem mensalidade · Sem contrato · Pague apenas pelos contatos que desbloquear
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
