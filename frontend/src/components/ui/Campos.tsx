import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface Base {
  rotulo: string
  erro?: string
  ajuda?: ReactNode
  obrigatorio?: boolean
}

function Rodape({ id, erro, ajuda }: { id: string; erro?: string; ajuda?: ReactNode }) {
  if (erro) {
    return (
      <p id={`${id}-erro`} className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
        {erro}
      </p>
    )
  }
  if (ajuda) {
    return (
      <p id={`${id}-ajuda`} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        {ajuda}
      </p>
    )
  }
  return null
}

function Rotulo({ id, rotulo, obrigatorio }: { id: string; rotulo: string; obrigatorio?: boolean }) {
  return (
    <label htmlFor={id} className="rotulo">
      {rotulo}
      {obrigatorio && (
        <span className="ml-0.5 text-red-500" aria-hidden>
          *
        </span>
      )}
    </label>
  )
}

export function Campo({ rotulo, erro, ajuda, obrigatorio, className = '', ...props }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className={className}>
      <Rotulo id={id} rotulo={rotulo} obrigatorio={obrigatorio} />
      <input
        id={id}
        required={obrigatorio}
        aria-invalid={!!erro}
        aria-describedby={erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined}
        className={`campo ${erro ? 'campo-erro' : ''}`}
        {...props}
      />
      <Rodape id={id} erro={erro} ajuda={ajuda} />
    </div>
  )
}

export function Selecao({
  rotulo,
  erro,
  ajuda,
  obrigatorio,
  className = '',
  children,
  ...props
}: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <div className={className}>
      <Rotulo id={id} rotulo={rotulo} obrigatorio={obrigatorio} />
      <select
        id={id}
        required={obrigatorio}
        aria-invalid={!!erro}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`campo ${erro ? 'campo-erro' : ''}`}
        {...props}
      >
        {children}
      </select>
      <Rodape id={id} erro={erro} ajuda={ajuda} />
    </div>
  )
}

export function AreaTexto({ rotulo, erro, ajuda, obrigatorio, className = '', ...props }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div className={className}>
      <Rotulo id={id} rotulo={rotulo} obrigatorio={obrigatorio} />
      <textarea
        id={id}
        required={obrigatorio}
        aria-invalid={!!erro}
        className={`campo min-h-24 resize-y ${erro ? 'campo-erro' : ''}`}
        {...props}
      />
      <Rodape id={id} erro={erro} ajuda={ajuda} />
    </div>
  )
}

/** Campo de busca compacto para barras de filtro. */
export function CampoBusca({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="search" className={`campo ${className}`} {...props} />
}
