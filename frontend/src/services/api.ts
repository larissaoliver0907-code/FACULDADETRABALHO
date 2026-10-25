import type { ErroApi } from '../types'

/**
 * Cliente HTTP da API. O token JWT fica em sessionStorage (é descartado ao fechar a aba)
 * e é enviado no cabeçalho Authorization. Nenhum segredo do servidor existe no frontend.
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'
const CHAVE_TOKEN = 'educonnect.token'

let aoExpirarSessao: (() => void) | null = null

export const tokenStorage = {
  obter: (): string | null => {
    try {
      return sessionStorage.getItem(CHAVE_TOKEN)
    } catch {
      return null
    }
  },
  salvar: (token: string) => {
    try {
      sessionStorage.setItem(CHAVE_TOKEN, token)
    } catch {
      /* armazenamento indisponível: a sessão dura apenas enquanto a página estiver aberta */
    }
  },
  limpar: () => {
    try {
      sessionStorage.removeItem(CHAVE_TOKEN)
    } catch {
      /* ignorado */
    }
  },
}

export function registrarAoExpirarSessao(callback: () => void) {
  aoExpirarSessao = callback
}

export class ApiError extends Error {
  readonly status: number
  readonly campos?: Record<string, string>

  constructor(erro: ErroApi) {
    super(erro.mensagem)
    this.status = erro.status
    this.campos = erro.campos
  }
}

type Parametros = Record<string, string | number | boolean | undefined | null>

function montarUrl(caminho: string, params?: Parametros) {
  const url = `${BASE_URL}${caminho}`
  if (!params) return url
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
  })
  const s = qs.toString()
  return s ? `${url}?${s}` : url
}

/** Build de demonstração: as chamadas são atendidas por uma API simulada no navegador. */
export const MODO_DEMO = import.meta.env.VITE_DEMO === 'true'

async function requisicaoDemo<T>(metodo: string, caminho: string, corpo?: unknown, params?: Parametros): Promise<T> {
  const mock = await import('./demo/mockApi')
  mock.restaurarSessao(tokenStorage.obter())
  try {
    return (await mock.mockRequisicao(metodo, caminho, corpo as Record<string, unknown> | undefined, params ?? {})) as T
  } catch (e) {
    const erro = e as ErroApi
    if (erro.status === 401 && caminho !== '/auth/login') {
      tokenStorage.limpar()
      aoExpirarSessao?.()
    }
    throw new ApiError(erro)
  }
}

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown, params?: Parametros): Promise<T> {
  if (MODO_DEMO) return requisicaoDemo<T>(metodo, caminho, corpo, params)
  const headers: Record<string, string> = {}
  const token = tokenStorage.obter()
  if (token) headers.Authorization = `Bearer ${token}`
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'

  let resposta: Response
  try {
    resposta = await fetch(montarUrl(caminho, params), {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ApiError({ status: 0, mensagem: 'Não foi possível conectar ao servidor. Verifique sua conexão.' })
  }

  if (resposta.status === 401 && caminho !== '/auth/login') {
    tokenStorage.limpar()
    aoExpirarSessao?.()
  }
  if (!resposta.ok) {
    let erro: ErroApi = { status: resposta.status, mensagem: 'Não foi possível concluir a operação.' }
    try {
      const corpoErro = await resposta.json()
      erro = { status: resposta.status, mensagem: corpoErro.mensagem ?? erro.mensagem, campos: corpoErro.campos }
    } catch {
      /* resposta sem corpo JSON */
    }
    throw new ApiError(erro)
  }
  if (resposta.status === 204) return undefined as T
  return (await resposta.json()) as T
}

export const api = {
  get: <T>(caminho: string, params?: Parametros) => requisicao<T>('GET', caminho, undefined, params),
  post: <T>(caminho: string, corpo?: unknown, params?: Parametros) => requisicao<T>('POST', caminho, corpo, params),
  put: <T>(caminho: string, corpo?: unknown) => requisicao<T>('PUT', caminho, corpo),
  patch: <T>(caminho: string, params?: Parametros) => requisicao<T>('PATCH', caminho, undefined, params),
  delete: <T>(caminho: string) => requisicao<T>('DELETE', caminho),

  /** Baixa um arquivo autenticado (CSV/PDF) e dispara o download no navegador. */
  async baixar(caminho: string, params: Parametros, nomeArquivo: string) {
    if (MODO_DEMO) {
      throw new ApiError({
        status: 0,
        mensagem: 'Na prévia, a exportação de CSV e PDF fica desativada. Ela funciona com o backend em execução.',
      })
    }
    const token = tokenStorage.obter()
    const resposta = await fetch(montarUrl(caminho, params), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {
      throw new ApiError({ status: 0, mensagem: 'Não foi possível conectar ao servidor.' })
    })
    if (!resposta.ok) {
      throw new ApiError({ status: resposta.status, mensagem: 'Não foi possível gerar o arquivo.' })
    }
    const blob = await resposta.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nomeArquivo
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
}
