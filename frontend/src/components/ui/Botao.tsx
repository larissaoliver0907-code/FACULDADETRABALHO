import { Loader2, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'perigo' | 'fantasma'
type Tamanho = 'sm' | 'md'

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
  icone?: LucideIcon
  carregando?: boolean
}

const variantes: Record<Variante, string> = {
  primario:
    'bg-marinho-900 text-white hover:bg-marinho-800 shadow-sm shadow-marinho-900/20 dark:bg-blue-600 dark:hover:bg-blue-500',
  secundario:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10',
  perigo: 'bg-red-600 text-white hover:bg-red-500 shadow-sm shadow-red-600/20',
  fantasma: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10',
}

const tamanhos: Record<Tamanho, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
}

export function Botao({
  variante = 'primario',
  tamanho = 'md',
  icone: Icone,
  carregando,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: BotaoProps) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      className={`inline-flex shrink-0 items-center justify-center font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variante]} ${tamanhos[tamanho]} ${className}`}
      {...props}
    >
      {carregando ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        Icone && <Icone className={tamanho === 'sm' ? 'size-3.5' : 'size-4'} aria-hidden />
      )}
      {children}
    </button>
  )
}

export function BotaoIcone({
  icone: Icone,
  rotulo,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icone: LucideIcon; rotulo: string }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      className={`inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white ${className}`}
      {...props}
    >
      <Icone className="size-4" aria-hidden />
    </button>
  )
}
