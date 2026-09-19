'use client'

/** Ошибка в корневом layout: свой <html>, без провайдеров и стилей приложения. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '96px 24px', color: '#171717' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Что-то пошло не так · Nimadir xato ketdi</h1>
          <p style={{ marginTop: 12, color: '#525252' }}>
            Мы уже разбираемся. Попробуйте обновить страницу. · Sahifani yangilab ko‘ring.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              borderRadius: 9999,
              border: 0,
              background: '#c4507a',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Попробовать снова · Qayta urinish
          </button>
        </div>
      </body>
    </html>
  )
}
