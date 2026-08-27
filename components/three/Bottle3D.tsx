'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Настоящий 3D-флакон SEVIMLI (three.js). v2 после злого судьи:
 * - three.js и вся сцена грузятся ТОЛЬКО когда контейнер реально виден
 *   (на мобиле блок display:none — не грузится вообще ничего);
 * - камера смотрит чуть сверху, тень ложится в кадр;
 * - жидкость — отдельный профиль с плоским мениском;
 * - инерция драга в рад/с (не зависит от FPS), touch-action: pan-y;
 * - этикетка шрифтом бренда (Playfair из --font-playfair);
 * - полный dispose: геометрии, материалы, текстуры, env-таргет, контекст;
 * - при reduced-motion рендер только по надобности (драг/инерция).
 * Подсказка живёт внутри компонента и гаснет после первого касания.
 */
export default function Bottle3D({ className, hint }: { className?: string; hint?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let cleanup: (() => void) | null = null
    let started = false

    const start = async () => {
      if (started || disposed) return
      started = true

      let THREE: typeof import('three')
      let RoomEnvironment: typeof import('three/examples/jsm/environments/RoomEnvironment.js').RoomEnvironment
      try {
        THREE = await import('three')
        ;({ RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js'))
      } catch {
        setFailed(true)
        return
      }
      if (disposed) return

      let renderer: import('three').WebGLRenderer
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      } catch {
        setFailed(true)
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(host.clientWidth || 320, host.clientHeight || 440)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.domElement.style.cursor = 'grab'
      renderer.domElement.style.touchAction = 'pan-y'
      host.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        35,
        (host.clientWidth || 320) / (host.clientHeight || 440),
        0.1,
        50,
      )
      camera.position.set(0, 1.1, 7)
      camera.lookAt(0, -0.1, 0)

      const pmrem = new THREE.PMREMGenerator(renderer)
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
      scene.environment = envRT.texture

      const key = new THREE.DirectionalLight(0xffffff, 1.4)
      key.position.set(3, 5, 4)
      scene.add(key)
      scene.add(new THREE.AmbientLight(0xfbeaf0, 0.5))

      const group = new THREE.Group()
      scene.add(group)

      // Профиль флакона: основание -> стенки -> плечо -> горлышко
      const profile: import('three').Vector2[] = []
      const pts: [number, number][] = [
        [0.0, -1.5], [0.72, -1.5], [0.86, -1.42], [0.92, -1.2],
        [0.95, -0.4], [0.95, 0.5], [0.88, 0.85], [0.62, 1.1],
        [0.4, 1.22], [0.34, 1.3], [0.34, 1.5], [0.0, 1.5],
      ]
      for (const [x, y] of pts) profile.push(new THREE.Vector2(x, y))

      // Стекло: альфа-прозрачность вместо transmission — через флакон
      // просвечивает сама страница, одинаково на любой видеокарте
      // (transmission на пустой сцене заливался молочно-белым)
      const glass = new THREE.Mesh(
        new THREE.LatheGeometry(profile, 64),
        new THREE.MeshPhysicalMaterial({
          color: 0xf3c3d8,
          roughness: 0.04,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
          envMapIntensity: 1.15,
        }),
      )
      glass.renderOrder = 2
      group.add(glass)

      // Жидкость: собственный профиль с плоским мениском (не копия бутылки)
      const liquidProfile: import('three').Vector2[] = []
      for (const [x, y] of [
        [0.0, -1.42], [0.68, -1.42], [0.82, -1.34], [0.88, -1.1],
        [0.9, -0.4], [0.9, 0.45], [0.0, 0.45],
      ] as [number, number][]) {
        liquidProfile.push(new THREE.Vector2(x, y))
      }
      const liquid = new THREE.Mesh(
        new THREE.LatheGeometry(liquidProfile, 48),
        new THREE.MeshPhysicalMaterial({
          color: 0xe88bb0,
          roughness: 0.25,
          transparent: true,
          opacity: 0.8,
        }),
      )
      liquid.renderOrder = 1
      group.add(liquid)

      // Золотая крышка + кольцо
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd9b380,
        metalness: 1,
        roughness: 0.28,
        envMapIntensity: 1.2,
      })
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.62, 48), goldMat)
      cap.position.y = 1.78
      group.add(cap)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 16, 48), goldMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 1.5
      group.add(ring)

      // Этикетка шрифтом бренда
      const fam =
        getComputedStyle(document.documentElement).getPropertyValue('--font-playfair').trim() ||
        'Georgia'
      try {
        await document.fonts.ready
      } catch {
        /* рисуем чем есть */
      }
      if (disposed) {
        renderer.dispose()
        renderer.domElement.remove()
        return
      }
      const label = document.createElement('canvas')
      label.width = 512
      label.height = 256
      const ctx = label.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 512, 256)
      ctx.fillStyle = '#c4507a'
      ctx.font = `bold 74px ${fam}, Georgia, serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('SEVIMLI', 256, 108)
      ctx.fillStyle = '#a3a3a3'
      ctx.font = `28px ${fam}, Georgia, serif`
      ctx.fillText('rose serum · 50 ml', 256, 176)
      const labelTex = new THREE.CanvasTexture(label)
      labelTex.colorSpace = THREE.SRGBColorSpace
      // Этикетка сидит на прямой части стенки (r=0.95 между y −0.4…0.5),
      // не вылезая за силуэт там, где корпус сужается
      const labelMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.965, 0.965, 0.8, 64, 1, true, -0.9, 1.8),
        new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.6 }),
      )
      labelMesh.position.y = 0.05
      group.add(labelMesh)

      // Мягкая тень-подложка
      const shadowCanvas = document.createElement('canvas')
      shadowCanvas.width = 128
      shadowCanvas.height = 128
      const sctx = shadowCanvas.getContext('2d')!
      const grad = sctx.createRadialGradient(64, 64, 8, 64, 64, 64)
      grad.addColorStop(0, 'rgba(110,50,70,0.35)')
      grad.addColorStop(1, 'rgba(110,50,70,0)')
      sctx.fillStyle = grad
      sctx.fillRect(0, 0, 128, 128)
      const shadowTex = new THREE.CanvasTexture(shadowCanvas)
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 3.6),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
      )
      shadow.rotation.x = -Math.PI / 2
      shadow.position.y = -1.62
      scene.add(shadow)

      // Ресайз контейнера
      const ro = new ResizeObserver(() => {
        const w = host.clientWidth
        const h = host.clientHeight
        if (!w || !h) return
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      })
      ro.observe(host)

      // Вращение: авто + драг с инерцией в рад/с (не зависит от FPS)
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let vel = 0 // рад/с
      let dragging = false
      let lastX = 0
      let lastT = 0
      let visible = true
      let raf = 0
      group.rotation.y = -0.5

      const onDown = (e: PointerEvent) => {
        dragging = true
        lastX = e.clientX
        lastT = e.timeStamp
        renderer.domElement.style.cursor = 'grabbing'
        renderer.domElement.setPointerCapture(e.pointerId)
        setTouched(true)
      }
      const onMove = (e: PointerEvent) => {
        if (!dragging) return
        const dx = e.clientX - lastX
        const dtp = Math.max((e.timeStamp - lastT) / 1000, 1 / 240)
        lastX = e.clientX
        lastT = e.timeStamp
        group.rotation.y += dx * 0.012
        vel = (dx * 0.012) / dtp
      }
      const onUp = () => {
        dragging = false
        renderer.domElement.style.cursor = 'grab'
      }
      renderer.domElement.addEventListener('pointerdown', onDown)
      renderer.domElement.addEventListener('pointermove', onMove)
      renderer.domElement.addEventListener('pointerup', onUp)
      renderer.domElement.addEventListener('pointercancel', onUp)

      const io2 = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
      })
      io2.observe(host)

      let running = true
      let prev = performance.now()
      const loop = (now: number) => {
        if (!running) return
        raf = requestAnimationFrame(loop)
        const dt = Math.min((now - prev) / 1000, 0.05)
        prev = now
        if (!visible || document.hidden) return
        const auto = reduced ? 0 : 0.35
        if (!dragging) {
          group.rotation.y += (auto + vel) * dt
          vel *= Math.exp(-3 * dt)
          if (Math.abs(vel) < 0.001) vel = 0
        }
        if (!reduced) group.position.y = Math.sin(now / 1400) * 0.06
        // при reduced рендерим только когда есть движение
        if (reduced && !dragging && vel === 0) return
        renderer.render(scene, camera)
      }
      if (reduced) renderer.render(scene, camera) // первый кадр
      raf = requestAnimationFrame(loop)

      cleanup = () => {
        running = false
        cancelAnimationFrame(raf)
        ro.disconnect()
        io2.disconnect()
        renderer.domElement.removeEventListener('pointerdown', onDown)
        renderer.domElement.removeEventListener('pointermove', onMove)
        renderer.domElement.removeEventListener('pointerup', onUp)
        renderer.domElement.removeEventListener('pointercancel', onUp)
        scene.traverse((o) => {
          const mesh = o as import('three').Mesh
          if (mesh.geometry) mesh.geometry.dispose()
          const m = mesh.material as
            | import('three').Material
            | import('three').Material[]
            | undefined
          const mats = Array.isArray(m) ? m : m ? [m] : []
          for (const mat of mats) {
            const withMap = mat as { map?: { dispose(): void } }
            withMap.map?.dispose()
            mat.dispose()
          }
        })
        labelTex.dispose()
        shadowTex.dispose()
        envRT.dispose()
        pmrem.dispose()
        renderer.dispose()
        renderer.forceContextLoss()
        renderer.domElement.remove()
      }
    }

    // Ленивый старт: пока контейнер невидим (display:none на мобиле) —
    // не грузим ни чанк three, ни контекст
    const gate = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        gate.disconnect()
        start()
      }
    })
    gate.observe(host)

    return () => {
      disposed = true
      gate.disconnect()
      cleanup?.()
    }
  }, [])

  if (failed) return null
  return (
    <div>
      <div ref={hostRef} className={className} />
      {hint && (
        <p
          className={
            'mt-1 text-center text-[11px] uppercase tracking-[0.2em] text-neutral-400 transition-opacity duration-500 ' +
            (touched ? 'opacity-0' : 'opacity-100')
          }
        >
          {hint}
        </p>
      )}
    </div>
  )
}
