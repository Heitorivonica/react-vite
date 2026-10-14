// Capa da tela de login (lado esquerdo). Os números dos cards são só ilustrativos.

const glass = 'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl shadow-black/20'

const background = {
  backgroundColor: '#04363d',
  backgroundImage: [
    'radial-gradient(circle at 15% 15%, rgba(77, 220, 104, 0.38), transparent 45%)',
    'radial-gradient(circle at 85% 95%, rgba(77, 220, 104, 0.18), transparent 45%)',
    'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
}

function TodayCard() {
  return (
    <div className={`${glass} animate-float absolute left-0 top-8 w-64 p-4`}>
      <div className="text-[10px] tracking-widest text-white/60 font-semibold">HOJE</div>
      <div className="mt-3 flex gap-5 text-white">
        <div>
          <div className="text-2xl font-bold">24</div>
          <div className="text-[11px] text-white/60">tarefas</div>
        </div>
        <div>
          <div className="text-2xl font-bold">8</div>
          <div className="text-[11px] text-white/60">fazendo</div>
        </div>
        <div>
          <div className="text-2xl font-bold">92%</div>
          <div className="text-[11px] text-white/60">no prazo</div>
        </div>
      </div>
      <svg viewBox="0 0 220 60" className="mt-3 w-full h-12" fill="none" aria-hidden="true">
        <path
          d="M0 50 C25 40, 40 52, 65 38 S105 30, 130 32 S175 12, 220 6"
          stroke="#4ddc68"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function BoardCard() {
  const columns = [
    { label: 'A fazer', task: null },
    { label: 'Fazendo', task: 'Proposta Acme' },
    { label: 'Feito', task: null },
  ]
  return (
    <div className={`${glass} animate-float-slow absolute right-0 top-0 w-48 p-3`}>
      <div className="text-[10px] tracking-widest text-white/60 font-semibold">QUADRO</div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {columns.map((col) => (
          <div key={col.label} className="rounded-lg bg-black/25 p-1.5 min-h-16">
            <div className="text-[8px] text-white/60 mb-1">{col.label}</div>
            {col.task && (
              <div className="rounded bg-white/90 px-1 py-1 text-[8px] font-semibold text-brand-dark leading-tight">
                {col.task}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Notification({ title, text, time, light, className = '' }) {
  return (
    <div
      className={`${
        light ? 'bg-white/90 text-brand-dark border-white' : `${glass} text-white`
      } border rounded-xl px-3 py-2.5 shadow-lg shadow-black/20 w-60 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold">{title}</div>
        <div className={`text-[10px] ${light ? 'text-brand-dark/60' : 'text-white/60'}`}>{time}</div>
      </div>
      <div className={`text-[11px] ${light ? 'text-brand-dark/70' : 'text-white/70'}`}>{text}</div>
    </div>
  )
}

export default function LoginCover() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white" style={background}>
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-semibold tracking-widest text-white/80">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          SUA EQUIPE, EM SINTONIA
        </span>
        <h2 className="mt-8 text-5xl xl:text-6xl font-bold leading-tight">
          Que bom te ver
          <br />
          <span className="text-brand">de novo.</span>
        </h2>
        <p className="mt-4 max-w-sm text-lg text-white/70">
          Tarefas, prazos e equipe no mesmo lugar — continuando de onde você parou.
        </p>
      </div>

      <div className="relative h-72 xl:h-80 w-full max-w-md">
        <TodayCard />
        <BoardCard />
        <Notification
          title="Prazo amanhã"
          text="3 tarefas vencem amanhã"
          time="2 min"
          className="absolute right-2 top-40 xl:top-44"
        />
        <Notification
          light
          title="Tarefa concluída"
          text="Proposta enviada ao cliente"
          time="1 min"
          className="absolute right-0 top-56 xl:top-60"
        />
      </div>

      <div className={`${glass} max-w-md px-4 py-3`}>
        <div className="text-[10px] font-semibold tracking-widest text-brand">TALKBI TAREFAS</div>
        <div className="text-sm text-white/80">Simples, rápido e feito para o seu time.</div>
      </div>
    </div>
  )
}
