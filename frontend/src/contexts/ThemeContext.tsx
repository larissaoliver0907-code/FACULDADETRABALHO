import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Tema = 'claro' | 'escuro'

interface ThemeContextValue {
  tema: Tema
  alternar: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const CHAVE = 'educonnect.tema'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() =>
    document.documentElement.classList.contains('dark') ? 'escuro' : 'claro',
  )

  const alternar = useCallback(() => {
    setTema((atual) => {
      const novo: Tema = atual === 'claro' ? 'escuro' : 'claro'
      document.documentElement.classList.toggle('dark', novo === 'escuro')
      try {
        localStorage.setItem(CHAVE, novo)
      } catch {
        /* preferência não persistida */
      }
      return novo
    })
  }, [])

  return <ThemeContext.Provider value={{ tema, alternar }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return ctx
}
