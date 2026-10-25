import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { registrarAoExpirarSessao, tokenStorage } from '../services/api'
import { authService } from '../services/educonnect'
import type { Perfil, UsuarioLogado } from '../types'

interface AuthContextValue {
  usuario: UsuarioLogado | null
  carregando: boolean
  sessaoExpirada: boolean
  entrar: (login: string, senha: string) => Promise<UsuarioLogado>
  sair: () => void
  temPerfil: (...perfis: Perfil[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [sessaoExpirada, setSessaoExpirada] = useState(false)

  // Restaura a sessão a partir do token salvo, validando-o no servidor.
  useEffect(() => {
    if (!tokenStorage.obter()) {
      setCarregando(false)
      return
    }
    authService
      .me()
      .then(setUsuario)
      .catch(() => tokenStorage.limpar())
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    registrarAoExpirarSessao(() => {
      setUsuario((atual) => {
        if (atual) setSessaoExpirada(true)
        return null
      })
    })
  }, [])

  const entrar = useCallback(async (login: string, senha: string) => {
    const resposta = await authService.login(login, senha)
    tokenStorage.salvar(resposta.token)
    setSessaoExpirada(false)
    setUsuario(resposta.usuario)
    return resposta.usuario
  }, [])

  const sair = useCallback(() => {
    tokenStorage.limpar()
    setSessaoExpirada(false)
    setUsuario(null)
  }, [])

  const temPerfil = useCallback((...perfis: Perfil[]) => !!usuario && perfis.includes(usuario.perfil), [usuario])

  const valor = useMemo(
    () => ({ usuario, carregando, sessaoExpirada, entrar, sair, temPerfil }),
    [usuario, carregando, sessaoExpirada, entrar, sair, temPerfil],
  )
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
