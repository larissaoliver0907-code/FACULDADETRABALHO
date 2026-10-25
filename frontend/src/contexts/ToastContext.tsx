import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type TipoToast = 'sucesso' | 'erro' | 'info'

interface Toast {
  id: number
  tipo: TipoToast
  mensagem: string
}

interface ToastContextValue {
  sucesso: (mensagem: string) => void
  erro: (mensagem: string) => void
  info: (mensagem: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const estilos: Record<TipoToast, string> = {
  sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-950 dark:text-emerald-100',
  erro: 'border-red-200 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-red-950 dark:text-red-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/30 dark:bg-marinho-800 dark:text-blue-100',
}

const icones = { sucesso: CheckCircle2, erro: AlertCircle, info: Info }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remover = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const adicionar = useCallback(
    (tipo: TipoToast, mensagem: string) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t.slice(-3), { id, tipo, mensagem }])
      setTimeout(() => remover(id), tipo === 'erro' ? 6000 : 3500)
    },
    [remover],
  )

  const valor: ToastContextValue = {
    sucesso: useCallback((m: string) => adicionar('sucesso', m), [adicionar]),
    erro: useCallback((m: string) => adicionar('erro', m), [adicionar]),
    info: useCallback((m: string) => adicionar('info', m), [adicionar]),
  }

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((t) => {
          const Icone = icones[t.tipo]
          return (
            <div
              key={t.id}
              role={t.tipo === 'erro' ? 'alert' : 'status'}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${estilos[t.tipo]}`}
            >
              <Icone className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="flex-1">{t.mensagem}</p>
              <button onClick={() => remover(t.id)} className="opacity-60 hover:opacity-100" aria-label="Fechar aviso">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
