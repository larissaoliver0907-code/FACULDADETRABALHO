import { useCallback, useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { ApiError } from '../services/api'

/**
 * Estado de formulário com erros por campo. Erros de validação do backend (campos)
 * são exibidos junto aos campos; demais erros aparecem como aviso.
 */
export function useFormulario<T extends object>(inicial: T) {
  const [valores, setValores] = useState<T>(inicial)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()

  const alterar = useCallback(<K extends keyof T>(campo: K, valor: T[K]) => {
    setValores((v) => ({ ...v, [campo]: valor }))
    setErros((e) => {
      if (!e[campo as string]) return e
      const copia = { ...e }
      delete copia[campo as string]
      return copia
    })
  }, [])

  const reiniciar = useCallback((novos: T) => {
    setValores(novos)
    setErros({})
  }, [])

  /** Executa o envio; devolve true em caso de sucesso. */
  const enviar = useCallback(
    async (acao: () => Promise<unknown>, mensagemSucesso?: string, validar?: () => Record<string, string>) => {
      const locais = validar?.() ?? {}
      if (Object.keys(locais).length > 0) {
        setErros(locais)
        return false
      }
      setEnviando(true)
      try {
        await acao()
        if (mensagemSucesso) toast.sucesso(mensagemSucesso)
        return true
      } catch (e) {
        if (e instanceof ApiError && e.campos) {
          setErros(e.campos)
          toast.erro(e.message)
        } else {
          toast.erro(e instanceof ApiError ? e.message : 'Não foi possível salvar.')
        }
        return false
      } finally {
        setEnviando(false)
      }
    },
    [toast],
  )

  return { valores, alterar, erros, setErros, enviando, enviar, reiniciar }
}

export const REGEX_SENHA = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/
export const MSG_SENHA = 'Use de 8 a 72 caracteres, com pelo menos uma letra e um número.'
export const REGEX_LOGIN = /^[A-Za-z0-9._-]{3,60}$/
export const MSG_LOGIN = 'De 3 a 60 caracteres: letras, números, ponto, hífen ou sublinhado.'
export const REGEX_CODIGO = /^[A-Za-z0-9][A-Za-z0-9-]{1,19}$/
export const MSG_CODIGO = 'De 2 a 20 letras, números ou hífen.'
