import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function CabecalhoPagina({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string
  descricao?: string
  acoes?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  )
}

export function Cartao({
  titulo,
  descricao,
  acoes,
  children,
  className = '',
  semPadding,
}: {
  titulo?: string
  descricao?: string
  acoes?: ReactNode
  children: ReactNode
  className?: string
  semPadding?: boolean
}) {
  return (
    <section className={`card ${className}`}>
      {(titulo || acoes) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div>
            {titulo && <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{descricao}</p>}
          </div>
          {acoes}
        </div>
      )}
      <div className={semPadding ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

export function Indicador({
  rotulo,
  valor,
  icone: Icone,
  detalhe,
  destaque = 'azul',
}: {
  rotulo: string
  valor: ReactNode
  icone: LucideIcon
  detalhe?: string
  destaque?: 'azul' | 'marinho' | 'verde' | 'ambar' | 'violeta' | 'ciano'
}) {
  const cores = {
    azul: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    marinho: 'bg-marinho-50 text-marinho-700 dark:bg-marinho-400/15 dark:text-marinho-200',
    verde: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    ambar: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    violeta: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    ciano: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300',
  }
  return (
    <div className="card flex items-start gap-4 p-4 sm:p-5">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${cores[destaque]}`}>
        <Icone className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">{rotulo}</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-white">{valor}</p>
        {detalhe && <p className="mt-0.5 truncate text-xs text-slate-400">{detalhe}</p>}
      </div>
    </div>
  )
}

export function BarraFiltros({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center dark:border-white/10">{children}</div>
}
