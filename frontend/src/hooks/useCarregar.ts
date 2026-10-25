import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../services/api'

/**
 * Executa uma consulta assíncrona, controla carregamento/erro e permite recarregar.
 * Respostas de consultas antigas são descartadas para evitar condições de corrida.
 */
export function useCarregar<T>(consulta: () => Promise<T>, dependencias: unknown[]) {
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const geracao = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(consulta, dependencias)

  const recarregar = useCallback(async () => {
    const atual = ++geracao.current
    setCarregando(true)
    setErro(null)
    try {
      const resultado = await executar()
      if (atual === geracao.current) setDados(resultado)
    } catch (e) {
      if (atual === geracao.current) setErro(e instanceof ApiError ? e.message : 'Erro inesperado ao carregar os dados.')
    } finally {
      if (atual === geracao.current) setCarregando(false)
    }
  }, [executar])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  return { dados, carregando, erro, recarregar, setDados }
}

export function useDebounce<T>(valor: T, atraso = 350): T {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), atraso)
    return () => clearTimeout(t)
  }, [valor, atraso])
  return atrasado
}
