'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, BadgeCheck, Heart } from 'lucide-react'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'
import SilkBackground from '@/components/three/SilkBackground'

/**
 * 3D-hero «парящая витрина»: фото-карточки на разных translateZ в
 * перспективе, сцена наклоняется за курсором (только точный указатель,
 * rAF-цикл засыпает при сходимости), дальние карточки размыты (DOF).
 * Картинки — пре-ужатые 420px копии в /img/hero3d. Вся сцена — декорация
 * (aria-hidden), на мобильных остаются два уголка без чипов.
 */

interface FloatCard {
  src: string
  z: number
  tilt: number
  w: string
  pos: string
  dur: number
  delay: number
  /** За фокусом: сильный blur + приглушение (глубина резкости). */
  far?: boolean
  chip?: 'original' | 'likes' | 'friends'
  /** Показывать и на мобильных (остальные — только xl+). */
  mobile?: boolean
}

const CARDS: FloatCard[] = [
  { src: '/img/hero3d/k1.jpg', z: 160, tilt: -8, w: 'w-20 lg:w-32 xl:w-48', pos: 'left-2 top-[4%] lg:left-[3%] lg:top-[16%]', dur: 7, delay: 0, chip: 'original', mobile: true },
  { src: '/img/hero3d/post1.jpg', z: -150, tilt: 5, w: 'w-36', pos: 'left-[12%] top-[58%]', dur: 9, delay: 1.2, far: true },
  { src: '/img/hero3d/beauty.jpg', z: 40, tilt: -4, w: 'w-36', pos: 'left-[2%] top-[66%]', dur: 8, delay: 2.4 },
  { src: '/img/hero3d/post3.jpg', z: 200, tilt: 7, w: 'w-20 lg:w-32 xl:w-48', pos: 'right-2 top-[3%] lg:right-[3%] lg:top-[14%]', dur: 7.5, delay: 0.6, chip: 'likes', mobile: true },
  { src: '/img/hero3d/k2.jpg', z: -140, tilt: -6, w: 'w-36', pos: 'right-[13%] top-[60%]', dur: 9.5, delay: 1.8, far: true },
  { src: '/img/hero3d/p16.jpg', z: 60, tilt: 5, w: 'w-36', pos: 'right-[2%] top-[54%]', dur: 8.5, delay: 3, chip: 'friends' },
]

const SPARKLES = [
  { left: '18%', top: '22%', size: 5, delay: 0 },
  { left: '26%', top: '70%', size: 4, delay: 1.4 },
  { left: '38%', top: '14%', size: 3, delay: 2.8 },
  { left: '62%', top: '12%', size: 4, delay: 0.9 },
  { left: '74%', top: '30%', size: 5, delay: 2.1 },
  { left: '82%', top: '64%', size: 4, delay: 3.4 },
  { left: '55%', top: '80%', size: 3, delay: 1.9 },
  { left: '10%', top: '44%', size: 3, delay: 4.2 },
]

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")"

/** Тень карточки соответствует высоте полёта. */
function cardShadow(z: number): string {
  if (z < 0) return '0 10px 24px -14px rgba(120,60,80,.18)'
  return `0 ${Math.round(18 + z / 8)}px ${Math.round(44 + z / 5)}px -18px rgba(196,80,122,${(0.22 + z / 1000).toFixed(2)})`
}

export default function Hero() {
  const router = useRouter()
  const { t } = useLang()
  const [query, setQuery] = useState('')
  const sectionRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const anim = useRef({ tx: 0, ty: 0, cx: 0, cy: 0, raf: 0 })

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Наклон только для точного указателя: на таче эффект не запускаем вовсе
    if (!window.matchMedia('(pointer: fine)').matches) return
    const s = anim.current
    let running = true
    let rect: DOMRect | null = null

    const write = () => {
      el.style.setProperty('--hy', s.cx.toFixed(2) + 'deg')
      el.style.setProperty('--hx', (-s.cy).toFixed(2) + 'deg')
    }
    const tick = () => {
      if (!running) return
      const dx = s.tx - s.cx
      const dy = s.ty - s.cy
      // Сошлись — цикл засыпает до следующего движения мыши
      if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) {
        s.cx = s.tx
        s.cy = s.ty
        write()
        s.raf = 0
        return
      }
      s.cx += dx * 0.06
      s.cy += dy * 0.06
      write()
      s.raf = requestAnimationFrame(tick)
    }
    const kick = () => {
      if (!s.raf) s.raf = requestAnimationFrame(tick)
    }

    const onEnter = () => {
      rect = el.getBoundingClientRect()
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!rect) rect = el.getBoundingClientRect()
      s.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 7
      s.ty = (0.5 - (e.clientY - rect.top) / rect.height) * 5
      kick()
    }
    const onLeave = () => {
      s.tx = 0
      s.ty = 0
      kick()
    }
    const onResize = () => {
      rect = null
    }
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize)
    return () => {
      running = false
      if (s.raf) cancelAnimationFrame(s.raf)
      s.raf = 0
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) {
      inputRef.current?.focus()
      return
    }
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const chip = (kind: FloatCard['chip']) => {
    if (kind === 'original')
      return (
        <span className="absolute -bottom-3 left-3 hidden items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-secondary shadow-md lg:flex">
          <BadgeCheck size={13} /> {t.hero.chipOriginal}
        </span>
      )
    if (kind === 'likes')
      return (
        <span className="absolute bottom-3 left-3 hidden items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary shadow-md lg:flex">
          <Heart size={12} className="fill-primary" /> 2.4k
        </span>
      )
    return (
      <span className="absolute -bottom-3 left-3 hidden items-center rounded-full bg-white py-1 pl-1.5 pr-2.5 text-xs font-semibold text-neutral-700 shadow-md lg:flex">
        <span className="mr-1.5 flex -space-x-1.5">
          {['a1', 'a2', 'a4'].map((a) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a}
              src={`/img/avatars/${a}.jpg`}
              alt=""
              className="h-4.5 w-4.5 rounded-full border border-white object-cover"
            />
          ))}
        </span>
        {t.hero.chipFriends}
      </span>
    )
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-primary-light via-primary-light/40 to-white"
    >
      {/* Жидкий шёлк хан-атлас: рукописный WebGL-шейдер, реагирует на мышь */}
      <SilkBackground className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* 3D-сцена: парящие карточки (чистая декорация) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ perspective: '1400px' }}>
        <div
          className="absolute inset-0"
          style={{
            transform: 'rotateX(var(--hx,0deg)) rotateY(var(--hy,0deg))',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {CARDS.map((c) => (
            <div
              key={c.src}
              className={cn('absolute', c.pos, c.w, c.mobile ? 'opacity-70 lg:opacity-100' : 'hidden xl:block')}
              style={{
                transform: `translateZ(${c.z}px) scale(${(1 + c.z / 900).toFixed(3)})`,
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="hero-float relative"
                style={{
                  animation: `hero-float ${c.dur}s ease-in-out ${c.delay}s infinite`,
                  ['--tilt' as string]: `${c.tilt}deg`,
                  ...(c.far ? { opacity: 0.45 } : {}),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.src}
                  alt=""
                  loading="lazy"
                  className={cn(
                    'aspect-[3/4] w-full rounded-2xl object-cover',
                    !c.far && 'border-4 border-white',
                  )}
                  style={{
                    boxShadow: cardShadow(c.z),
                    ...(c.far ? { filter: 'blur(7px) saturate(.8)' } : {}),
                  }}
                />
                {/* лёгкий бренд-грейд поверх фото */}
                <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[#c4507a]/10 mix-blend-multiply" />
                {c.chip && chip(c.chip)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Искры (только десктоп) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        {SPARKLES.map((sp, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#e88bb0]"
            style={{
              left: sp.left,
              top: sp.top,
              width: sp.size,
              height: sp.size,
              boxShadow: '0 0 10px 3px rgba(196,80,122,.55), 0 0 4px 1px rgba(255,255,255,.9)',
              animation: `hero-twinkle ${3 + (i % 3)}s ease-in-out ${sp.delay}s infinite`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Зерно */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Мягкий шов с белой страницей: растворяет низ шёлка и карточек */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-40 bg-gradient-to-b from-transparent via-white/55 to-white"
      />

      <div className="relative z-10 mx-auto flex min-h-[48vh] max-w-4xl flex-col items-center justify-center px-4 pb-10 pt-14 text-center sm:min-h-[60vh] sm:pb-12 sm:pt-20">
        <span className="mb-4 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur">
          {t.hero.badge}
        </span>
        <h1 className="font-display text-[2rem] font-extrabold leading-[1.15] text-neutral-900 sm:text-6xl sm:leading-tight">
          {t.hero.title}
        </h1>
        <p className="mt-4 max-w-xl text-base text-neutral-600 sm:mt-5 sm:text-lg">{t.hero.subtitle}</p>

        <form onSubmit={onSubmit} className="mt-8 flex w-full max-w-xl gap-2">
          <div className="relative flex-1">
            <Search
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.hero.searchPlaceholder}
              aria-label={t.hero.searchPlaceholder}
              className="input h-14 rounded-full pl-12 text-base shadow-sm"
            />
          </div>
          <button type="submit" className="btn-primary h-14 shrink-0 px-8 shadow-sm">
            {t.hero.find}
          </button>
        </form>
      </div>
    </section>
  )
}
