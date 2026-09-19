'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Barcode } from 'lucide-react'
import { useLoyalty } from '@/store/loyalty'
import { isSupabaseConfigured } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useHasMounted } from '@/lib/hooks'
import { tierOf, nextTierOf, tierProgress } from '@/lib/loyalty'
import { formatPointsLang } from '@/lib/format'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'

/**
 * Живая 3D-карта лояльности. Всё рисуется CSS-слоями без библиотек:
 * наклон за курсором/гироскопом, металл с динамическим светом,
 * перламутровая фольга, вспыхивающая у блика, проекционная тень под
 * картой, флип на оборот с штрих-кодом. Значения пишутся в CSS-переменные
 * на обёртке напрямую из rAF-цикла, минуя ре-рендеры React.
 */

/** Шум-напыление против бандинга градиентов (SVG feTurbulence). */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.55'/></svg>\")"

/** Детерминированный штрих-код из номера карты: ширины бар выводятся из цифр. */
function BarcodeSvg({ code }: { code: string }) {
  const digits = (code.replace(/\D/g, '') || '5555165091092448').split('').map(Number)
  const bars: { x: number; w: number }[] = []
  let x = 0
  const push = (w: number, gap: number) => {
    bars.push({ x, w })
    x += w + gap
  }
  push(2, 1)
  push(1, 2) // старт-символ
  for (let round = 0; round < 2; round++) {
    for (const d of digits) {
      push(1 + ((d + round) % 3), 1 + ((d * 7 + round * 3) % 2))
    }
  }
  push(1, 2)
  push(2, 0) // стоп-символ
  return (
    <svg viewBox={`0 0 ${x} 40`} preserveAspectRatio="none" className="h-10 w-full" aria-hidden="true">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={40} fill="#171717" />
      ))}
    </svg>
  )
}

interface ServerLoyalty {
  points: number
  cardNo: string | null
}

/**
 * Карта лояльности. Демо — баллы и номер из localStorage; боевой режим — с сервера (проп server):
 * баллы начисляет complete_order, номер карты выдаёт ensure_loyalty_card(). server = null → гость.
 */
export default function LoyaltyCard({ className, server }: { className?: string; server?: ServerLoyalty | null }) {
  const mounted = useHasMounted()
  const { lang, t } = useLang()
  const storePoints = useLoyalty((s) => s.points)
  const storeCardNo = useLoyalty((s) => s.cardNo)
  const ensureCard = useLoyalty((s) => s.ensureCard)
  const live = isSupabaseConfigured()
  const [issuedNo, setIssuedNo] = useState<string | null>(null)
  const points = live ? (server?.points ?? 0) : storePoints
  const cardNo = live ? (server?.cardNo ?? issuedNo) : storeCardNo

  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [coarse, setCoarse] = useState(false)
  const [gyroAsk, setGyroAsk] = useState(false)
  // Вся анимация в ref: цель (t*), текущее (c*), блик (m*), флип
  const anim = useRef({
    tx: 0, ty: 0, cx: 0, cy: 0,
    mx: 50, my: 50, smx: 50, smy: 50,
    driven: false, flip: 0, flipCur: 0, raf: 0,
  })

  // Зависимости — примитивы: объект server создаётся родителем заново на каждом рендере,
  // и эффект с ним в зависимостях дёргал бы RPC снова и снова
  const needCard = live && Boolean(server) && !server?.cardNo
  const requested = useRef(false)
  useEffect(() => {
    if (!live) {
      ensureCard()
      return
    }
    // Боевой режим: номер карты выдаёт сервер, один запрос на монтирование
    if (!needCard || requested.current) return
    requested.current = true
    createClient()
      .rpc('ensure_loyalty_card')
      .then(({ data }) => {
        if (typeof data === 'string') setIssuedNo(data)
      })
  }, [live, needCard, ensureCard])

  // Настройки среды: reduced-motion (с подпиской на смену), тач, iOS-гироскоп
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    // Настройки среды читаются только на клиенте после монтирования — осознанный setState в эффекте
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    setCoarse(window.matchMedia('(pointer: coarse)').matches)
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    if (
      typeof D.requestPermission === 'function' &&
      !localStorage.getItem('sevimli-gyro')
    ) {
      setGyroAsk(true)
    }
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const el = cardRef.current
    const wrap = wrapRef.current
    if (!el || !wrap) return
    const s = anim.current
    let running = true

    const write = () => {
      wrap.style.setProperty('--ry', (s.cx + s.flipCur).toFixed(2) + 'deg')
      wrap.style.setProperty('--rx', (-s.cy).toFixed(2) + 'deg')
      wrap.style.setProperty('--ryn', s.cx.toFixed(2))
      wrap.style.setProperty('--mx', s.smx.toFixed(1) + '%')
      wrap.style.setProperty('--my', s.smy.toFixed(1) + '%')
      wrap.style.setProperty('--sx', (-s.cx * 1.2).toFixed(1) + 'px')
    }

    const tick = (now: number) => {
      if (!running) return
      if (!s.driven && !reduced) {
        // Никто не трогает — карта еле заметно «дышит», блик медленно плывёт
        const p = now / 1000
        s.tx = Math.sin(p * 0.6) * 3.5
        s.ty = Math.cos(p * 0.8) * 2.5
        s.mx = 50 + Math.sin(p * 0.5) * 22
        s.my = 50 + Math.cos(p * 0.7) * 22
      }
      if (reduced) {
        s.tx = 0
        s.ty = 0
      }
      s.cx += (s.tx - s.cx) * 0.08
      s.cy += (s.ty - s.cy) * 0.08
      s.smx += (s.mx - s.smx) * 0.1
      s.smy += (s.my - s.smy) * 0.1
      s.flipCur += (s.flip - s.flipCur) * 0.09
      write()
      // При reduced-motion цикл живёт только пока доигрывается флип
      if (reduced && Math.abs(s.flip - s.flipCur) < 0.1 && Math.abs(s.cx) < 0.1) {
        s.flipCur = s.flip
        write()
        return
      }
      s.raf = requestAnimationFrame(tick)
    }
    const start = () => {
      cancelAnimationFrame(s.raf)
      s.raf = requestAnimationFrame(tick)
    }
    start()
    ;(el as HTMLDivElement & { __startAnim?: () => void }).__startAnim = start

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      s.driven = true
      s.tx = (px - 0.5) * 22
      s.ty = (0.5 - py) * 18
      s.mx = px * 100
      s.my = py * 100
    }
    const onLeave = () => {
      s.driven = false
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      s.driven = true
      s.tx = Math.max(-14, Math.min(14, e.gamma * 0.6))
      s.ty = Math.max(-12, Math.min(12, (45 - e.beta) * 0.4))
      s.mx = 50 + s.tx * 3
      s.my = 50 + s.ty * 3
    }

    if (!reduced) {
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      window.addEventListener('deviceorientation', onOrient)
    }
    return () => {
      running = false
      cancelAnimationFrame(s.raf)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('deviceorientation', onOrient)
    }
  }, [mounted, reduced])

  /** Чистый флип — без системных диалогов. */
  function onFlip() {
    const s = anim.current
    s.flip = s.flip === 0 ? 180 : 0
    setFlipped(s.flip !== 0)
    const el = cardRef.current as (HTMLDivElement & { __startAnim?: () => void }) | null
    el?.__startAnim?.()
  }

  /** Явное включение гироскопа на iOS — по нажатию на чип, не по случайному тапу. */
  function enableGyro() {
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    setGyroAsk(false)
    D.requestPermission?.()
      .then((res) => localStorage.setItem('sevimli-gyro', res))
      .catch(() => localStorage.setItem('sevimli-gyro', 'denied'))
  }

  if (!mounted) {
    return <div className={cn('h-56 animate-pulse rounded-2xl bg-neutral-100', className)} />
  }

  const tier = tierOf(points)
  const next = nextTierOf(points)
  const progress = tierProgress(points)

  const embossText = {
    textShadow: '0 1px 0 rgba(255,255,255,.28), 0 -1px 1px rgba(0,0,0,.4)',
  }
  const labelShadow = { textShadow: '0 1px 2px rgba(40,20,10,.4)' }

  // Слои металла, перламутра и света — общие для обеих сторон
  const holoLayers = (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px]">
      {/* динамический диффузный свет: направление зависит от наклона */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(calc(135deg + var(--ryn, 0) * 3deg), rgba(255,255,255,.26), transparent 42%, rgba(0,0,0,.22))',
          mixBlendMode: 'overlay',
        }}
      />
      {/* постоянный брашинг металла по всей поверхности */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          background:
            'repeating-linear-gradient(105deg, rgba(255,255,255,.6) 0 1px, transparent 1px 3px, rgba(0,0,0,.4) 3px 4px, transparent 4px 7px)',
        }}
      />
      {/* перламутровая фольга: узкая тёплая палитра, вспыхивает у света */}
      <div
        className="absolute inset-[-30%]"
        style={{
          background:
            'conic-gradient(from 180deg at var(--mx,50%) var(--my,50%), #ffd9e8, #ffe9c7, #fff3f7, #f0dcff, #ffd9e8)',
          filter: 'blur(9px) saturate(1.7)',
          mixBlendMode: 'color-dodge',
          opacity: 0.2,
        }}
      />
      {/* дифракционные полосы — видны только в зоне блика */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(105deg, rgba(255,170,200,.7) 0 2px, rgba(255,225,170,.7) 4px, rgba(255,245,250,.5) 8px, rgba(225,190,255,.6) 12px, transparent 16px 26px)',
          WebkitMaskImage:
            'radial-gradient(45% 70% at var(--mx,50%) var(--my,50%), #000 0%, transparent 70%)',
          maskImage:
            'radial-gradient(45% 70% at var(--mx,50%) var(--my,50%), #000 0%, transparent 70%)',
          mixBlendMode: 'color-dodge',
          opacity: 0.45,
        }}
      />
      {/* анизотропный линейный блик металла */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, transparent calc(var(--mx,50%) - 14%), rgba(255,255,255,.55) var(--mx,50%), transparent calc(var(--mx,50%) + 14%))',
          mixBlendMode: 'screen',
          filter: 'blur(6px)',
        }}
      />
      {/* мягкий ambient-отсвет */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background:
            'radial-gradient(320px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,.7), transparent 70%)',
          mixBlendMode: 'soft-light',
        }}
      />
      {/* зерно-напыление против бандинга */}
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  )

  const faceShadow = {
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,.4), inset 0 -1px 1px rgba(0,0,0,.3), inset 0 0 0 1px rgba(255,255,255,.08)',
  }

  return (
    <div className={cn('space-y-4', className)}>
      {gyroAsk && (
        <button
          onClick={enableGyro}
          className="mx-auto block rounded-full bg-primary-light px-4 py-1.5 text-xs font-medium text-primary"
        >
          {t.loyalty.gyroAsk}
        </button>
      )}

      {/* Сцена: перспектива + проекционная тень вне 3D */}
      <div ref={wrapRef} className="relative" style={{ perspective: '1100px' }}>
        <div
          aria-hidden="true"
          className="absolute inset-x-10 -bottom-2 h-5"
          style={{
            borderRadius: '50%',
            background: 'rgba(110,66,50,.32)',
            filter: 'blur(9px)',
            transform: 'translateX(var(--sx,0px))',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-4 -bottom-4 h-8"
          style={{
            borderRadius: '50%',
            background: 'rgba(110,66,50,.16)',
            filter: 'blur(26px)',
            transform: 'translateX(calc(var(--sx,0px) * 1.6))',
          }}
        />

        <div
          ref={cardRef}
          onClick={onFlip}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onFlip()
            }
          }}
          tabIndex={0}
          role="button"
          aria-pressed={flipped}
          aria-label={t.loyalty.flipLabel}
          className="relative aspect-[1.586] w-full cursor-pointer select-none rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
          style={{
            transform: 'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* торец-ребро: по одному за каждой гранью, чтобы не перекрывать оборот */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[14px]"
            style={{
              transform: 'translateZ(-2px)',
              background: '#4d2f20',
              backfaceVisibility: 'hidden',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[14px]"
            style={{
              transform: 'rotateY(180deg) translateZ(-2px)',
              background: '#4d2f20',
              backfaceVisibility: 'hidden',
            }}
          />

          {/* ЛИЦО */}
          <div
            aria-hidden={flipped}
            className={cn('absolute inset-0 rounded-[14px] bg-gradient-to-br p-6 text-white', tier.gradient)}
            style={{
              backfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
              ...faceShadow,
            }}
          >
            {holoLayers}

            <div
              className="relative flex items-start justify-between"
              style={{ transform: 'translateZ(6px)' }}
            >
              <div>
                <p className="font-display text-2xl font-extrabold tracking-tight" style={embossText}>
                  SEVIMLI
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-widest opacity-90" style={labelShadow}>
                  Loyalty Card
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                style={{
                  background: tier.chip,
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.25)',
                  textShadow: '0 1px 1px rgba(0,0,0,.35)',
                }}
              >
                {tier.label}
              </span>
            </div>

            <div
              className="relative mt-7 flex items-center justify-between"
              style={{ transform: 'translateZ(4px)' }}
            >
              <p className="font-mono text-lg tracking-widest" style={embossText}>
                {cardNo ?? '•••• •••• •••• ••••'}
              </p>
              <Barcode size={18} className="opacity-70" aria-hidden="true" />
            </div>

            <div
              className="relative mt-4 flex items-end justify-between"
              style={{ transform: 'translateZ(6px)' }}
            >
              <div>
                <p className="text-xs uppercase tracking-wide opacity-90" style={labelShadow}>
                  {t.loyalty.balance}
                </p>
                <p className="font-display text-3xl font-extrabold" style={embossText}>
                  {points.toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide opacity-90" style={labelShadow}>
                  {t.loyalty.cashback}
                </p>
                <p className="font-display text-2xl font-bold" style={embossText}>
                  {tier.cashback}%
                </p>
              </div>
            </div>
          </div>

          {/* ОБОРОТ: магнитная полоса + штрих-код для кассира */}
          <div
            aria-hidden={!flipped}
            className={cn('absolute inset-0 rounded-[14px] bg-gradient-to-br p-6 text-white', tier.gradient)}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              ...faceShadow,
            }}
          >
            {holoLayers}
            {/* магнитная лента: непрозрачный сатин */}
            <div
              className="relative -mx-6 mt-3 h-12"
              style={{
                background: 'linear-gradient(180deg, #0b0b0b, #383838 35%, #131313 65%, #000)',
              }}
            />
            <div className="relative mt-5 rounded-md bg-white px-4 py-3 text-neutral-900">
              <BarcodeSvg code={cardNo ?? ''} />
              <p className="mt-1.5 text-center font-mono text-sm tracking-[0.25em]">
                {cardNo ?? '•••• •••• •••• ••••'}
              </p>
            </div>
            <p
              className="relative mt-3 text-center text-xs uppercase tracking-widest opacity-90"
              style={labelShadow}
            >
              {t.loyalty.backHint}
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-neutral-500">
        {coarse ? t.loyalty.holoHintTouch : t.loyalty.holoHint}
      </p>
      <p className="sr-only">
        {t.loyalty.balance}: {formatPointsLang(points, lang)}. {tier.label}, {t.loyalty.cashback}{' '}
        {tier.cashback}%.
      </p>

      {/* Прогресс до следующего уровня */}
      <div className="rounded-2xl border border-neutral-200 p-5">
        {next ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-800">
                {t.loyalty.toTier} {next.label}
              </span>
              <span className="text-neutral-500">
                {formatPointsLang(Math.max(0, next.threshold - points), lang)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              {t.loyalty.earnRule1} {tier.cashback}{t.loyalty.earnRule2}
            </p>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles size={16} /> {t.loyalty.maxTier}
          </p>
        )}
      </div>
    </div>
  )
}
