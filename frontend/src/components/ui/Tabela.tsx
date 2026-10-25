import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { BotaoIcone } from './Botao'

export interface Coluna<T> {
  titulo: string
  celula: (item: T) => ReactNode
  className?: string
  /** Oculta a coluna em telas pequenas (o cartão móvel mostra o essencial). */
  ocultarNoCelular?: boolean
}

interface TabelaProps<T> {
  colunas: Coluna<T>[]
  itens: T[]
  chave: (item: T) => string | number
  aoClicarLinha?: (item: T) => void
  acoes?: (item: T) => ReactNode
}

/** Tabela responsiva: rolagem horizontal contida e colunas secundárias ocultas no celular. */
export function Tabela<T>({ colunas, itens, chave, aoClicarLinha, acoes }: TabelaProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:border-white/10 dark:text-slate-400">
            {colunas.map((c) => (
              <th key={c.titulo} scope="col" className={`px-4 py-3 whitespace-nowrap ${c.ocultarNoCelular ? 'hidden md:table-cell' : ''} ${c.className ?? ''}`}>
                {c.titulo}
              </th>
            ))}
            {acoes && (
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Ações</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {itens.map((item) => (
            <tr
              key={chave(item)}
              onClick={aoClicarLinha ? () => aoClicarLinha(item) : undefined}
              className={`transition ${aoClicarLinha ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5' : ''}`}
            >
              {colunas.map((c) => (
                <td key={c.titulo} className={`px-4 py-3 align-middle ${c.ocultarNoCelular ? 'hidden md:table-cell' : ''} ${c.className ?? ''}`}>
                  {c.celula(item)}
                </td>
              ))}
              {acoes && (
                <td className="px-2 py-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {acoes(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Paginacao({
  pagina,
  totalPaginas,
  totalElementos,
  aoMudar,
}: {
  pagina: number
  totalPaginas: number
  totalElementos: number
  aoMudar: (pagina: number) => void
}) {
  if (totalElementos === 0) return null
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
      <span>
        {totalElementos} {totalElementos === 1 ? 'registro' : 'registros'}
      </span>
      <div className="flex items-center gap-1">
        <BotaoIcone icone={ChevronLeft} rotulo="Página anterior" disabled={pagina <= 0} onClick={() => aoMudar(pagina - 1)} />
        <span className="px-2 tabular-nums">
          {pagina + 1} / {Math.max(totalPaginas, 1)}
        </span>
        <BotaoIcone
          icone={ChevronRight}
          rotulo="Próxima página"
          disabled={pagina + 1 >= totalPaginas}
          onClick={() => aoMudar(pagina + 1)}
        />
      </div>
    </div>
  )
}
