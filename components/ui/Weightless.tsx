import { cn } from '@/lib/utils'

/**
 * «Невесомость»: рукописные векторные тюбики/флаконы SEVIMLI, медленно
 * дрейфующие по экрану на фоне внутренних страниц. Слой fixed — предметы
 * парят в вьюпорте при скролле. Всё SVG, ноль запросов и килобайт.
 * seed меняет раскладку/набор, чтобы страницы не были клонами.
 */

const rose = ['#f6cfdd', '#e88bb0']
const gold = ['#ecd9a8', '#c9a35c']
const glass = ['#fbe3ee', '#f0b7cf']

function Tube() {
  return (
    <svg viewBox="0 0 100 220" className="h-full w-full">
      <defs>
        <linearGradient id="wt-tb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={rose[0]} />
          <stop offset="0.55" stopColor={rose[1]} />
          <stop offset="1" stopColor="#c4507a" />
        </linearGradient>
        <linearGradient id="wt-tg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={gold[0]} />
          <stop offset="1" stopColor={gold[1]} />
        </linearGradient>
      </defs>
      <rect x="34" y="26" width="32" height="34" rx="7" fill="url(#wt-tg)" />
      <rect x="30" y="58" width="40" height="10" rx="4" fill="#d998b4" />
      <path d="M30 66 Q30 62 34 62 H66 Q70 62 70 66 L74 186 Q75 202 60 202 H40 Q25 202 26 186 Z" fill="url(#wt-tb)" />
      <rect x="36" y="84" width="7" height="96" rx="3.5" fill="#fff" opacity="0.4" />
      <ellipse cx="50" cy="196" rx="22" ry="5" fill="#a03b61" opacity="0.25" />
    </svg>
  )
}

function Dropper() {
  return (
    <svg viewBox="0 0 100 220" className="h-full w-full">
      <defs>
        <linearGradient id="wd-gl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={glass[0]} />
          <stop offset="1" stopColor={glass[1]} />
        </linearGradient>
        <linearGradient id="wd-gd" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={gold[0]} />
          <stop offset="1" stopColor={gold[1]} />
        </linearGradient>
      </defs>
      <rect x="40" y="22" width="20" height="18" rx="6" fill="url(#wd-gd)" />
      <rect x="46" y="38" width="8" height="46" rx="3" fill="url(#wd-gd)" opacity="0.9" />
      <path d="M30 84 Q30 76 38 76 H62 Q70 76 70 84 V186 Q70 202 54 202 H46 Q30 202 30 186 Z" fill="url(#wd-gl)" opacity="0.9" />
      <path d="M33 132 H67 V186 Q67 199 54 199 H46 Q33 199 33 186 Z" fill={rose[1]} opacity="0.75" />
      <rect x="36" y="88" width="6" height="88" rx="3" fill="#fff" opacity="0.45" />
    </svg>
  )
}

function Jar() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <defs>
        <linearGradient id="wj-bd" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fdf3ec" />
          <stop offset="1" stopColor="#f3d3c0" />
        </linearGradient>
        <linearGradient id="wj-gd" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={gold[0]} />
          <stop offset="0.5" stopColor={gold[1]} />
          <stop offset="1" stopColor={gold[0]} />
        </linearGradient>
      </defs>
      <rect x="20" y="30" width="80" height="26" rx="10" fill="url(#wj-gd)" />
      <rect x="24" y="52" width="72" height="54" rx="16" fill="url(#wj-bd)" />
      <rect x="30" y="58" width="8" height="40" rx="4" fill="#fff" opacity="0.5" />
      <ellipse cx="60" cy="103" rx="30" ry="4" fill="#c9a35c" opacity="0.2" />
    </svg>
  )
}

function Lipstick() {
  return (
    <svg viewBox="0 0 100 220" className="h-full w-full">
      <defs>
        <linearGradient id="wl-cs" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e8b39b" />
          <stop offset="0.5" stopColor="#d99a80" />
          <stop offset="1" stopColor="#b87d63" />
        </linearGradient>
        <linearGradient id="wl-bt" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e57ba4" />
          <stop offset="1" stopColor="#c4507a" />
        </linearGradient>
      </defs>
      <path d="M40 64 L62 52 V116 H40 Z" fill="url(#wl-bt)" />
      <rect x="34" y="112" width="34" height="14" rx="4" fill="url(#wl-cs)" />
      <rect x="30" y="124" width="42" height="74" rx="8" fill="url(#wl-cs)" />
      <rect x="36" y="130" width="6" height="60" rx="3" fill="#fff" opacity="0.4" />
    </svg>
  )
}

function Perfume() {
  return (
    <svg viewBox="0 0 120 200" className="h-full w-full">
      <defs>
        <linearGradient id="wp-gl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={glass[0]} />
          <stop offset="1" stopColor={rose[1]} />
        </linearGradient>
        <linearGradient id="wp-gd" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={gold[0]} />
          <stop offset="1" stopColor={gold[1]} />
        </linearGradient>
      </defs>
      <rect x="48" y="24" width="24" height="24" rx="5" fill="url(#wp-gd)" />
      <rect x="52" y="46" width="16" height="14" rx="3" fill="#d9b380" />
      <path d="M28 76 Q28 60 46 60 H74 Q92 60 92 76 V156 Q92 176 72 176 H48 Q28 176 28 156 Z" fill="url(#wp-gl)" opacity="0.92" />
      <path d="M40 66 V170" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
      <path d="M80 66 V170" stroke="#a03b61" strokeWidth="4" strokeLinecap="round" opacity="0.15" />
    </svg>
  )
}

const OBJECTS = [Tube, Dropper, Jar, Lipstick, Perfume]

interface Slot {
  pos: string
  size: string
  rot: number
  dur: number
  delay: number
  far?: boolean
}

const SLOTS: Slot[] = [
  { pos: 'left-[2%] top-[6%]', size: 'h-40', rot: -14, dur: 13, delay: 0 },
  { pos: 'right-[3%] top-[14%]', size: 'h-36', rot: 12, dur: 15, delay: 1.1 },
  { pos: 'left-[4%] top-[34%]', size: 'h-28', rot: 10, dur: 17, delay: 2.2, far: true },
  { pos: 'right-[5%] top-[48%]', size: 'h-24', rot: -8, dur: 19, delay: 3.4, far: true },
  { pos: 'left-[3%] top-[66%]', size: 'h-32', rot: 7, dur: 16, delay: 1.7 },
  { pos: 'right-[2%] top-[80%]', size: 'h-32', rot: 6, dur: 14, delay: 0.6 },
  { pos: 'left-[5%] top-[92%]', size: 'h-24', rot: -10, dur: 18, delay: 2.9, far: true },
]

export default function WeightlessBg({ seed = 0 }: { seed?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden lg:block">
      {SLOTS.map((s, i) => {
        const Obj = OBJECTS[(i + seed) % OBJECTS.length]
        return (
          <div
            key={i}
            className={cn('weightless absolute', s.pos, s.size)}
            style={{
              aspectRatio: '1 / 2',
              ['--wr' as string]: `${s.rot}deg`,
              animation: `weightless ${s.dur}s ease-in-out ${s.delay}s infinite`,
              filter: s.far
                ? 'blur(2.5px) drop-shadow(0 14px 18px rgba(196,80,122,.12))'
                : 'drop-shadow(0 18px 26px rgba(196,80,122,.16))',
              opacity: s.far ? 0.45 : 0.75,
            }}
          >
            <Obj />
          </div>
        )
      })}
    </div>
  )
}
