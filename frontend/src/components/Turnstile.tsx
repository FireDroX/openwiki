import { useEffect, useId, useRef } from 'react'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SCRIPT_ID = 'cf-turnstile-script'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        },
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve()
  }
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    return new Promise((resolve) => existing.addEventListener('load', () => resolve()))
  }
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve())
    document.head.appendChild(script)
  })
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
}

export function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const containerId = useId()
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) {
      onVerify('')
      return
    }
    let cancelled = false

    void loadTurnstileScript().then(() => {
      if (cancelled || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(`#${CSS.escape(containerId)}`, {
        sitekey: siteKey,
        callback: onVerify,
        'expired-callback': onExpire,
      })
    })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  if (!siteKey) {
    return null
  }

  return <div id={containerId} />
}
