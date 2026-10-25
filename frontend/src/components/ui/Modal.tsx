import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Botao } from './Botao'

interface ModalProps {
  aberto: boolean
  titulo: string
  descricao?: string
  aoFechar: () => void
  children: ReactNode
  rodape?: ReactNode
  largura?: 'md' | 'lg' | 'xl'
}

const larguras = { md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }

/** Diálogo acessível: foco inicial, tecla Esc e bloqueio de rolagem do fundo. */
export function Modal({ aberto, titulo, descricao, aoFechar, children, rodape, largura = 'md' }: ModalProps) {
  const idTitulo = useId()
  const painel = useRef<HTMLDivElement>(null)
  // Guarda o callback em ref para que o efeito rode só ao abrir/fechar (e não roube o foco a cada render).
  const fecharRef = useRef(aoFechar)
  useEffect(() => {
    fecharRef.current = aoFechar
  }, [aoFechar])

  useEffect(() => {
    if (!aberto) return
    const anterior = document.activeElement as HTMLElement | null
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fecharRef.current()
    document.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'
    const primeiro = painel.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-fechar])')
    primeiro?.focus()
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.style.overflow = ''
      anterior?.focus?.()
    }
  }, [aberto])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-marinho-950/50 backdrop-blur-[2px]" onClick={aoFechar} aria-hidden />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-marinho-900 ${larguras[largura]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div>
            <h2 id={idTitulo} className="text-base font-semibold text-slate-900 dark:text-white">
              {titulo}
            </h2>
            {descricao && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{descricao}</p>}
          </div>
          <button
            data-fechar
            onClick={aoFechar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {rodape && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end dark:border-white/10">
            {rodape}
          </div>
        )}
      </div>
    </div>
  )
}

interface ConfirmacaoProps {
  aberto: boolean
  titulo: string
  mensagem: ReactNode
  textoConfirmar?: string
  perigoso?: boolean
  carregando?: boolean
  aoConfirmar: () => void
  aoCancelar: () => void
}

/** Confirmação obrigatória para ações destrutivas ou que afetam o acesso de usuários. */
export function Confirmacao({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  perigoso = true,
  carregando,
  aoConfirmar,
  aoCancelar,
}: ConfirmacaoProps) {
  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      aoFechar={aoCancelar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoCancelar} disabled={carregando}>
            Cancelar
          </Botao>
          <Botao variante={perigoso ? 'perigo' : 'primario'} onClick={aoConfirmar} carregando={carregando}>
            {textoConfirmar}
          </Botao>
        </>
      }
    >
      <div className="flex gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${perigoso ? 'bg-red-50 text-red-600 dark:bg-red-500/15' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/15'}`}
        >
          <AlertTriangle className="size-5" aria-hidden />
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">{mensagem}</div>
      </div>
    </Modal>
  )
}
