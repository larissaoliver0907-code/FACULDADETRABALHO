import { AlertCircle, Inbox, Loader2, RefreshCw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Botao } from './Botao'

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500 dark:text-slate-400">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {texto}
    </div>
  )
}

export function Esqueleto({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/10 ${className}`} aria-hidden />
}

export function EstadoVazio({
  titulo,
  descricao,
  icone: Icone = Inbox,
  acao,
}: {
  titulo: string
  descricao?: string
  icone?: LucideIcon
  acao?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5">
        <Icone className="size-6" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}

export function MensagemErro({ mensagem, aoTentarNovamente }: { mensagem: string; aoTentarNovamente?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center dark:border-red-400/30 dark:bg-red-950/50 dark:text-red-200"
    >
      <AlertCircle className="size-5 shrink-0" aria-hidden />
      <p className="flex-1">{mensagem}</p>
      {aoTentarNovamente && (
        <Botao tamanho="sm" variante="secundario" icone={RefreshCw} onClick={aoTentarNovamente}>
          Tentar novamente
        </Botao>
      )}
    </div>
  )
}

type CorEtiqueta = 'verde' | 'amarelo' | 'vermelho' | 'cinza' | 'azul' | 'roxo'

const cores: Record<CorEtiqueta, string> = {
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300',
  amarelo: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300',
  vermelho: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300',
  cinza: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-white/10 dark:text-slate-300',
  azul: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300',
  roxo: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/15 dark:text-violet-300',
}

export function Etiqueta({ cor = 'cinza', children }: { cor?: CorEtiqueta; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cores[cor]}`}>
      {children}
    </span>
  )
}

export function EtiquetaAtivo({ ativo }: { ativo: boolean }) {
  return <Etiqueta cor={ativo ? 'verde' : 'cinza'}>{ativo ? 'Ativo' : 'Inativo'}</Etiqueta>
}
