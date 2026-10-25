import { Info } from 'lucide-react'
import { MODO_DEMO } from '../services/api'

/** Faixa exibida apenas na prévia: deixa claro que os dados são exemplos e nada vai para um servidor. */
export function AvisoDemo() {
  if (!MODO_DEMO) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
      <Info className="size-3.5 shrink-0" aria-hidden />
      Prévia de demonstração: dados de exemplo, mantidos só neste navegador até recarregar a página.
    </div>
  )
}
