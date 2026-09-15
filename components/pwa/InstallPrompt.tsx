'use client'

import { useEffect, useState } from 'react'
import { X, Smartphone } from 'lucide-react'
import { useLang } from '@/components/LangProvider'

const DISMISS_KEY = 'sevimli-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Баннер установки приложения: на Android — нативный prompt,
 * на iOS Safari — подсказка «Поделиться → На экран Домой».
 */
export default function InstallPrompt() {
  const { t } = useLang()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISS_KEY)) return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // iOS: beforeinstallprompt не существует — показываем подсказку
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIos) {
      // Определение платформы возможно только после монтирования — осознанный setState в эффекте
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowIos(true)
      setVisible(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* приватный режим — просто скрываем до перезагрузки */
    }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') setVisible(false)
    setDeferred(null)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl md:left-auto md:right-5 md:bottom-5 md:w-96">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Smartphone size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-neutral-900">{t.pwa.installTitle}</p>
          <p className="mt-0.5 text-sm text-neutral-600">
            {showIos && !deferred ? t.pwa.iosHint : t.pwa.installText}
          </p>
          <div className="mt-3 flex gap-2">
            {deferred && (
              <button onClick={install} className="btn-primary !px-4 !py-2 text-sm">
                {t.pwa.install}
              </button>
            )}
            <button onClick={dismiss} className="btn-ghost !px-4 !py-2 text-sm">
              {t.pwa.later}
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="shrink-0 rounded-full p-1 text-neutral-400 hover:bg-neutral-100" aria-label="✕">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
