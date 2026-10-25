import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Carregando } from './components/ui/Feedback'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { AppLayout } from './layouts/AppLayout'
import { paginaInicial } from './layouts/navegacao'
import Login from './pages/Login'
import { MODO_DEMO } from './services/api'
import type { Perfil } from './types'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Alunos = lazy(() => import('./pages/Alunos'))
const AlunoDetalhe = lazy(() => import('./pages/AlunoDetalhe'))
const Professores = lazy(() => import('./pages/Professores'))
const Cursos = lazy(() => import('./pages/Cursos'))
const Turmas = lazy(() => import('./pages/Turmas'))
const TurmaDetalhe = lazy(() => import('./pages/TurmaDetalhe'))
const Avaliacoes = lazy(() => import('./pages/Avaliacoes'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Usuarios = lazy(() => import('./pages/Usuarios'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))
const MeuPainel = lazy(() => import('./pages/MeuPainel'))
const NaoEncontrado = lazy(() => import('./pages/NaoEncontrado'))

/** Protege rotas: exige login e, opcionalmente, um dos perfis informados. */
function RotaProtegida({ perfis, children }: { perfis?: Perfil[]; children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  const location = useLocation()
  if (carregando) return <Carregando texto="Verificando sessão…" />
  if (!usuario) return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />
  if (perfis && !perfis.includes(usuario.perfil)) return <Navigate to={paginaInicial(usuario.perfil)} replace />
  return <>{children}</>
}

// Na prévia publicada a URL da página não pode mudar, então a navegação fica em memória.
const Roteador = MODO_DEMO ? MemoryRouter : BrowserRouter

const ADMIN: Perfil[] = ['ADMINISTRADOR']
const EQUIPE: Perfil[] = ['ADMINISTRADOR', 'PROFESSOR']

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Roteador>
            <Suspense fallback={<Carregando />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <RotaProtegida>
                      <AppLayout />
                    </RotaProtegida>
                  }
                >
                  <Route index element={<RotaProtegida perfis={EQUIPE}><Dashboard /></RotaProtegida>} />
                  <Route path="alunos" element={<RotaProtegida perfis={ADMIN}><Alunos /></RotaProtegida>} />
                  <Route path="alunos/:id" element={<RotaProtegida perfis={ADMIN}><AlunoDetalhe /></RotaProtegida>} />
                  <Route path="professores" element={<RotaProtegida perfis={ADMIN}><Professores /></RotaProtegida>} />
                  <Route path="cursos" element={<RotaProtegida perfis={EQUIPE}><Cursos /></RotaProtegida>} />
                  <Route path="turmas" element={<RotaProtegida perfis={EQUIPE}><Turmas /></RotaProtegida>} />
                  <Route path="turmas/:id" element={<RotaProtegida perfis={EQUIPE}><TurmaDetalhe /></RotaProtegida>} />
                  <Route path="avaliacoes" element={<RotaProtegida perfis={EQUIPE}><Avaliacoes /></RotaProtegida>} />
                  <Route path="relatorios" element={<RotaProtegida perfis={ADMIN}><Relatorios /></RotaProtegida>} />
                  <Route path="usuarios" element={<RotaProtegida perfis={ADMIN}><Usuarios /></RotaProtegida>} />
                  <Route path="configuracoes" element={<Configuracoes />} />
                  <Route path="meu-painel" element={<RotaProtegida perfis={['ALUNO']}><MeuPainel /></RotaProtegida>} />
                  <Route path="minhas-notas" element={<RotaProtegida perfis={['ALUNO']}><MeuPainel somenteNotas /></RotaProtegida>} />
                  <Route path="*" element={<NaoEncontrado />} />
                </Route>
              </Routes>
            </Suspense>
          </Roteador>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
