import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Users, MapPin, TrendingUp } from "lucide-react";

// ─── Dados por estado (representantes aproximados) ────────────────────────────
const STATE_DATA: Record<string, { name: string; reps: number; cx: number; cy: number }> = {
  SP: { name: "São Paulo",       reps: 38420, cx: 310, cy: 430 },
  MG: { name: "Minas Gerais",    reps: 22180, cx: 310, cy: 340 },
  RJ: { name: "Rio de Janeiro",  reps: 18650, cx: 340, cy: 410 },
  RS: { name: "Rio Grande do Sul", reps: 14320, cx: 270, cy: 530 },
  PR: { name: "Paraná",          reps: 13890, cx: 270, cy: 470 },
  BA: { name: "Bahia",           reps: 11240, cx: 360, cy: 280 },
  SC: { name: "Santa Catarina",  reps: 10780, cx: 270, cy: 500 },
  GO: { name: "Goiás",           reps: 7650,  cx: 280, cy: 320 },
  PE: { name: "Pernambuco",      reps: 6890,  cx: 390, cy: 220 },
  CE: { name: "Ceará",           reps: 5420,  cx: 390, cy: 180 },
  DF: { name: "Distrito Federal",reps: 4980,  cx: 295, cy: 330 },
  ES: { name: "Espírito Santo",  reps: 4320,  cx: 360, cy: 380 },
  MT: { name: "Mato Grosso",     reps: 3870,  cx: 230, cy: 310 },
  MS: { name: "Mato Grosso do Sul", reps: 3540, cx: 240, cy: 400 },
  PA: { name: "Pará",            reps: 2980,  cx: 290, cy: 180 },
  AM: { name: "Amazonas",        reps: 1870,  cx: 190, cy: 160 },
  RN: { name: "Rio Grande do Norte", reps: 2140, cx: 415, cy: 195 },
  PB: { name: "Paraíba",         reps: 1980,  cx: 405, cy: 210 },
  AL: { name: "Alagoas",         reps: 1650,  cx: 395, cy: 245 },
  SE: { name: "Sergipe",         reps: 1420,  cx: 385, cy: 258 },
  MA: { name: "Maranhão",        reps: 2340,  cx: 340, cy: 190 },
  PI: { name: "Piauí",           reps: 1780,  cx: 360, cy: 215 },
  TO: { name: "Tocantins",       reps: 1240,  cx: 300, cy: 245 },
  RO: { name: "Rondônia",        reps: 980,   cx: 190, cy: 260 },
  AC: { name: "Acre",            reps: 540,   cx: 150, cy: 250 },
  AP: { name: "Amapá",           reps: 420,   cx: 320, cy: 130 },
  RR: { name: "Roraima",         reps: 380,   cx: 220, cy: 110 },
};

const REGIONS = [
  { name: "Sudeste",    states: ["SP","MG","RJ","ES"], color: "#22c55e", total: 83570 },
  { name: "Sul",        states: ["RS","PR","SC"],       color: "#3b82f6", total: 38990 },
  { name: "Nordeste",   states: ["BA","PE","CE","RN","PB","AL","SE","MA","PI"], color: "#f59e0b", total: 32860 },
  { name: "Centro-Oeste", states: ["GO","DF","MT","MS"], color: "#8b5cf6", total: 20040 },
  { name: "Norte",      states: ["PA","AM","TO","RO","AC","AP","RR"], color: "#ec4899", total: 8410 },
];

function AnimatedCounter({ end, duration = 1800 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString("pt-BR")}</span>;
}

export default function BrazilMapSection() {
  const [, navigate] = useLocation();
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [pulseIndex, setPulseIndex] = useState(0);
  const stateKeys = Object.keys(STATE_DATA);

  // Cicla os pulsos pelos estados para criar animação de "atividade ao vivo"
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((i) => (i + 1) % stateKeys.length);
    }, 400);
    return () => clearInterval(interval);
  }, [stateKeys.length]);

  const hovered = hoveredState ? STATE_DATA[hoveredState] : null;

  return (
    <section className="relative py-24 px-6 overflow-hidden bg-[#0a0f0a]">
      {/* Fundo com gradiente radial verde escuro */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(ellipse, oklch(0.25 0.12 152 / 0.5) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, oklch(0.20 0.10 152 / 0.3) 0%, transparent 70%)" }}
        />
        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(34,197,94,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Cobertura Nacional · Ao Vivo
          </div>
          <h2
            className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
          >
            Representantes em{" "}
            <span style={{ color: "#22c55e" }}>todos os estados</span>
            <br />
            do Brasil
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Mais de{" "}
            <span className="text-emerald-400 font-bold">
              <AnimatedCounter end={173987} />
            </span>{" "}
            representantes verificados, distribuídos por todos os 27 estados.
          </p>
        </div>

        {/* Layout principal: mapa + stats */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-center">
          {/* ── Mapa SVG ─────────────────────────────────────────────────── */}
          <div className="relative flex justify-center">
            {/* Tooltip */}
            {hovered && (
              <div
                className="absolute z-20 bg-[#0f1a0f] border border-emerald-500/30 rounded-xl px-4 py-3 shadow-2xl pointer-events-none"
                style={{ top: "10px", left: "50%", transform: "translateX(-50%)" }}
              >
                <p className="text-white font-bold text-sm">{hovered.name}</p>
                <p className="text-emerald-400 text-xs font-semibold mt-0.5">
                  {hovered.reps.toLocaleString("pt-BR")} representantes
                </p>
              </div>
            )}

            <svg
              viewBox="80 90 380 480"
              className="w-full max-w-[520px] drop-shadow-2xl"
              style={{ filter: "drop-shadow(0 0 60px oklch(0.35 0.15 152 / 0.4))" }}
            >
              {/* Silhueta do Brasil — path simplificado */}
              <path
                d="M220,100 L240,95 L270,98 L300,92 L330,100 L355,108 L375,120 L390,135 L400,150 L410,165 L415,180 L420,195 L418,210 L412,225 L405,240 L400,255 L395,265 L388,272 L380,278 L370,282 L358,285 L348,290 L342,298 L338,308 L335,320 L332,335 L330,350 L328,365 L325,380 L322,395 L318,408 L312,420 L305,432 L298,442 L290,450 L280,458 L270,464 L260,468 L250,470 L240,468 L230,462 L222,454 L215,444 L208,432 L202,418 L198,402 L196,386 L195,370 L196,355 L198,340 L200,325 L202,310 L202,295 L200,280 L196,265 L190,252 L183,240 L176,228 L170,215 L165,200 L162,185 L160,170 L160,155 L162,140 L167,127 L175,115 L185,106 L198,100 L210,97 Z"
                fill="oklch(0.18 0.08 152)"
                stroke="oklch(0.40 0.15 152)"
                strokeWidth="1.5"
              />
              {/* Região Norte (Amazônia) */}
              <path
                d="M160,155 L162,140 L167,127 L175,115 L185,106 L198,100 L210,97 L220,100 L240,95 L270,98 L300,92 L310,100 L315,115 L318,130 L315,145 L308,158 L298,168 L285,175 L270,180 L255,182 L240,180 L225,175 L212,168 L200,160 L190,155 L178,152 Z"
                fill="oklch(0.20 0.09 152)"
                stroke="oklch(0.35 0.12 152)"
                strokeWidth="0.8"
                opacity="0.7"
              />

              {/* Pontos dos estados */}
              {stateKeys.map((uf, idx) => {
                const s = STATE_DATA[uf];
                const isHovered = hoveredState === uf;
                const isPulsing = pulseIndex === idx;
                const size = s.reps > 20000 ? 8 : s.reps > 10000 ? 6 : s.reps > 5000 ? 5 : 4;
                const region = REGIONS.find(r => r.states.includes(uf));
                const color = region?.color ?? "#22c55e";

                return (
                  <g key={uf}>
                    {/* Anel de pulse */}
                    {isPulsing && (
                      <circle
                        cx={s.cx}
                        cy={s.cy}
                        r={size + 8}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        opacity="0"
                        style={{
                          animation: "ping 1s ease-out forwards",
                        }}
                      />
                    )}
                    {/* Halo hover */}
                    {isHovered && (
                      <circle
                        cx={s.cx}
                        cy={s.cy}
                        r={size + 6}
                        fill={color}
                        opacity="0.15"
                      />
                    )}
                    {/* Ponto principal */}
                    <circle
                      cx={s.cx}
                      cy={s.cy}
                      r={isHovered ? size + 2 : size}
                      fill={color}
                      opacity={isHovered ? 1 : 0.85}
                      style={{ cursor: "pointer", transition: "r 0.15s, opacity 0.15s" }}
                      onMouseEnter={() => setHoveredState(uf)}
                      onMouseLeave={() => setHoveredState(null)}
                    />
                    {/* Label do estado (apenas os maiores) */}
                    {s.reps > 10000 && (
                      <text
                        x={s.cx}
                        y={s.cy - size - 4}
                        textAnchor="middle"
                        fontSize="7"
                        fill="white"
                        opacity="0.7"
                        style={{ pointerEvents: "none", fontFamily: "system-ui, sans-serif", fontWeight: 600 }}
                      >
                        {uf}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Linhas de conexão animadas entre os maiores centros */}
              {[
                ["SP", "MG"], ["SP", "RJ"], ["SP", "PR"], ["MG", "BA"],
                ["PR", "RS"], ["PR", "SC"], ["MG", "GO"], ["GO", "DF"],
              ].map(([a, b], i) => {
                const sa = STATE_DATA[a], sb = STATE_DATA[b];
                if (!sa || !sb) return null;
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={sa.cx} y1={sa.cy}
                    x2={sb.cx} y2={sb.cy}
                    stroke="#22c55e"
                    strokeWidth="0.6"
                    opacity="0.20"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </svg>

            {/* CSS para a animação de ping */}
            <style>{`
              @keyframes ping {
                0%   { r: 8; opacity: 0.7; }
                100% { r: 22; opacity: 0; }
              }
            `}</style>
          </div>

          {/* ── Painel de stats ───────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Card total */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Total nacional</p>
                  <p
                    className="text-3xl font-black text-white tabular-nums"
                    style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
                  >
                    <AnimatedCounter end={173987} />
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/40">representantes verificados em todos os 27 estados</p>
            </div>

            {/* Regiões */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Por região
              </p>
              {REGIONS.map((region) => {
                const maxTotal = 83570;
                const pct = Math.round((region.total / maxTotal) * 100);
                return (
                  <div key={region.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: region.color }} />
                        <span className="text-sm text-white/70 font-medium">{region.name}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color: region.color }}>
                        {region.total.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: region.color, opacity: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-center">
                <MapPin className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p
                  className="text-2xl font-black text-white tabular-nums"
                  style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
                >
                  27
                </p>
                <p className="text-xs text-white/40 mt-0.5">estados cobertos</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-center">
                <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p
                  className="text-2xl font-black text-white tabular-nums"
                  style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
                >
                  +<AnimatedCounter end={312} duration={2500} />
                </p>
                <p className="text-xs text-white/40 mt-0.5">novos/semana</p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate("/register")}
              className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              Encontrar representante na minha região
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
