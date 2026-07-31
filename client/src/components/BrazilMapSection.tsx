import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Users, MapPin, TrendingUp } from "lucide-react";
import { BRAZIL_STATES } from "./brazilStatesData";

// ─── Regiões ──────────────────────────────────────────────────────────────────
const REGIONS = [
  { name: "Sudeste",      states: ["SP","MG","RJ","ES"],                          color: "#22c55e", total: 54250 },
  { name: "Sul",          states: ["RS","PR","SC"],                                color: "#3b82f6", total: 19900 },
  { name: "Nordeste",     states: ["BA","PE","CE","RN","PB","AL","SE","MA","PI"], color: "#f59e0b", total: 16160 },
  { name: "Centro-Oeste", states: ["GO","MT","MS","DF"],                           color: "#8b5cf6", total:  9000 },
  { name: "Norte",        states: ["PA","AM","TO","RO","AC","AP","RR"],            color: "#ec4899", total:  3720 },
];

const TOTAL = 103030;

// ─── Contador animado (dispara ao entrar na viewport) ─────────────────────────
function AnimatedCounter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(ease * end));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString("pt-BR")}</span>;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function BrazilMapSection() {
  const [, navigate] = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [pulseIdx, setPulseIdx] = useState(0);

  // Cicla o pulse pelos estados maiores para dar sensação de "ao vivo"
  const bigStates = BRAZIL_STATES.filter(s => s.reps > 1000).map(s => s.sigla);
  useEffect(() => {
    const id = setInterval(() => setPulseIdx(i => (i + 1) % bigStates.length), 600);
    return () => clearInterval(id);
  }, [bigStates.length]);

  const getRegion = (sigla: string) => REGIONS.find(r => r.states.includes(sigla));

  const getFill = (sigla: string) => {
    const region = getRegion(sigla);
    if (!region) return "rgba(255,255,255,0.04)";
    const isActive = !activeRegion || activeRegion === region.name;
    const isHov = hovered === sigla;
    if (!isActive) return "rgba(255,255,255,0.02)";
    if (isHov) return region.color;
    return region.color + "44";
  };

  const getStroke = (sigla: string) => {
    if (hovered === sigla) return "#ffffff";
    const region = getRegion(sigla);
    if (!region) return "#1e293b";
    const isActive = !activeRegion || activeRegion === region.name;
    return isActive ? region.color + "55" : "#0f172a";
  };

  const hoveredData = hovered ? BRAZIL_STATES.find(s => s.sigla === hovered) : null;
  const hoveredRegion = hovered ? getRegion(hovered) : null;

  return (
    <section className="relative py-24 px-6 overflow-hidden bg-[#060d06]">
      {/* ── Fundo ──────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(rgba(34,197,94,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Cobertura Nacional · Ao Vivo
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Representantes em{" "}
            <span style={{ color: "#22c55e" }}>todos os estados</span>
            <br className="hidden md:block" /> do Brasil
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Mais de{" "}
            <span className="text-emerald-400 font-bold">
              <AnimatedCounter end={173987} />
            </span>{" "}
            representantes verificados, distribuídos por todos os 27 estados.
          </p>
        </div>

        {/* ── Layout: mapa + painel ───────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-center">

          {/* ── Mapa SVG real ────────────────────────────────────────────── */}
          <div className="relative flex justify-center">
            {/* Tooltip flutuante */}
            {hoveredData && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none
                bg-slate-900/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm
                flex items-center gap-4 min-w-[220px]">
                <div className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: hoveredRegion?.color ?? "#22c55e" }} />
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{hoveredData.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: hoveredRegion?.color ?? "#22c55e" }}>
                    {hoveredData.reps.toLocaleString("pt-BR")} representantes
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-white/30 text-xs">{hoveredData.sigla}</p>
                  <p className="text-white/50 text-xs">{hoveredRegion?.name}</p>
                </div>
              </div>
            )}

            <svg
              viewBox="0 0 600 640"
              className="w-full max-w-[560px]"
              style={{ filter: "drop-shadow(0 0 50px rgba(34,197,94,0.18))" }}
            >
              <defs>
                <filter id="stateglow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Paths reais dos estados */}
              {BRAZIL_STATES.map(state => {
                const isHov = hovered === state.sigla;
                return (
                  <path
                    key={state.sigla}
                    d={state.path}
                    fill={getFill(state.sigla)}
                    stroke={getStroke(state.sigla)}
                    strokeWidth={isHov ? 1.5 : 0.6}
                    style={{ transition: "fill 0.25s ease, stroke 0.25s ease", cursor: "pointer" }}
                    filter={isHov ? "url(#stateglow)" : undefined}
                    onMouseEnter={() => setHovered(state.sigla)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}

              {/* Pontos pulsantes nos estados maiores */}
              {BRAZIL_STATES.filter(s => s.reps > 800).map((state, idx) => {
                const region = getRegion(state.sigla);
                const color = region?.color ?? "#22c55e";
                const isHov = hovered === state.sigla;
                const isPulse = bigStates[pulseIdx] === state.sigla;
                const r = state.reps > 20000 ? 5.5 : state.reps > 8000 ? 4.5 : state.reps > 3000 ? 3.5 : 2.8;

                return (
                  <g key={`dot-${state.sigla}`}
                    onMouseEnter={() => setHovered(state.sigla)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: "pointer" }}>
                    {/* Anel de pulse */}
                    {isPulse && (
                      <circle cx={state.cx} cy={state.cy} r={r + 10}
                        fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
                    )}
                    {/* Halo hover */}
                    {isHov && (
                      <circle cx={state.cx} cy={state.cy} r={r + 7}
                        fill={color} opacity="0.15" />
                    )}
                    {/* Ponto */}
                    <circle cx={state.cx} cy={state.cy}
                      r={isHov ? r + 2 : r}
                      fill={color}
                      opacity={isHov ? 1 : 0.9}
                      style={{ transition: "r 0.15s ease" }}
                    />
                    {/* Label para estados grandes */}
                    {state.reps > 7000 && (
                      <text x={state.cx} y={state.cy - r - 4}
                        textAnchor="middle" fontSize="6.5" fill="white" opacity="0.75"
                        style={{ pointerEvents: "none", fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: "0.05em" }}>
                        {state.sigla}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Linhas de conexão entre os maiores hubs */}
              {[["SP","MG"],["SP","RJ"],["SP","PR"],["MG","BA"],["PR","RS"],["PR","SC"],["MG","GO"]].map(([a, b]) => {
                const sa = BRAZIL_STATES.find(s => s.sigla === a);
                const sb = BRAZIL_STATES.find(s => s.sigla === b);
                if (!sa || !sb) return null;
                return (
                  <line key={`${a}-${b}`}
                    x1={sa.cx} y1={sa.cy} x2={sb.cx} y2={sb.cy}
                    stroke="#22c55e" strokeWidth="0.5" opacity="0.15" strokeDasharray="3 5" />
                );
              })}
            </svg>
          </div>

          {/* ── Painel lateral ───────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Card total */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Total nacional</p>
                  <p className="text-2xl font-black text-white tabular-nums leading-tight">
                    <AnimatedCounter end={173987} />
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/35 pl-12">representantes verificados em 27 estados</p>
            </div>

            {/* Regiões — clicável para filtrar o mapa */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">
                Por região — clique para filtrar
              </p>
              {REGIONS.map(region => {
                const pct = Math.round((region.total / TOTAL) * 100);
                const isActive = activeRegion === region.name;
                return (
                  <button key={region.name}
                    onClick={() => setActiveRegion(isActive ? null : region.name)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125"
                          style={{ background: region.color, boxShadow: isActive ? `0 0 8px ${region.color}` : "none" }} />
                        <span className={`text-sm font-semibold transition-colors ${isActive ? "text-white" : "text-white/60 group-hover:text-white/80"}`}>
                          {region.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: region.color }}>
                        {region.total.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: region.color, opacity: isActive ? 1 : 0.5 }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
                <MapPin className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                <p className="text-2xl font-black text-white">27</p>
                <p className="text-[10px] text-white/35 mt-0.5">estados cobertos</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
                <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                <p className="text-2xl font-black text-white">
                  +<AnimatedCounter end={312} duration={2500} />
                </p>
                <p className="text-[10px] text-white/35 mt-0.5">novos/semana</p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate("/register")}
              className="w-full flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              Encontrar representante na minha região
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
