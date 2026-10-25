import { BarChart3, Eye, EyeOff, GraduationCap, Lock, School, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Botao } from '../components/ui/Botao'
import { Campo } from '../components/ui/Campos'
import { MensagemErro } from '../components/ui/Feedback'
import { useAuth } from '../contexts/AuthContext'
import { paginaInicial } from '../layouts/navegacao'
import { AvisoDemo } from '../components/AvisoDemo'
import { ApiError, MODO_DEMO } from '../services/api'
import { CONTAS_DEMO, SENHA_DEMO } from '../services/demo/contas'

export default function Login() {
  const { usuario, entrar, sessaoExpirada } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (usuario) return <Navigate to={paginaInicial(usuario.perfil)} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!login.trim() || !senha) {
      setErro('Informe login e senha.')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const u = await entrar(login.trim(), senha)
      const destino = (location.state as { de?: string } | null)?.de
      navigate(destino && destino !== '/login' ? destino : paginaInicial(u.perfil), { replace: true })
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
      setSenha('')
    } finally {
      setEnviando(false)
    }
  }

  const destaques = [
    { icone: Users, texto: 'Alunos, professores e cursos em um só lugar' },
    { icone: School, texto: 'Turmas com controle de vagas e matrículas' },
    { icone: BarChart3, texto: 'Notas, médias e relatórios exportáveis' },
  ]

  return (
    <>
    <AvisoDemo />
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-marinho-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-blue-500/20 blur-3xl"
          aria-hidden
        />
        <div className="pointer-events-none absolute bottom-0 left-0 size-80 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/30">
            <GraduationCap className="size-6" />
          </div>
          <span className="text-lg font-semibold">EduConnect</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">Gestão acadêmica clara, do cadastro ao boletim.</h1>
          <ul className="mt-8 space-y-4">
            {destaques.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-marinho-100">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <Icone className="size-4" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-marinho-300">Para universidades, faculdades e escolas.</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-marinho-900 text-white">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-lg font-semibold">EduConnect</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Entrar</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use as credenciais fornecidas pela sua instituição.</p>

          {sessaoExpirada && (
            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              Sua sessão expirou. Entre novamente para continuar.
            </p>
          )}

          <form onSubmit={enviar} className="mt-8 space-y-5" noValidate>
            {erro && <MensagemErro mensagem={erro} />}
            <Campo
              rotulo="Login"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              obrigatorio
              autoFocus
            />
            <div>
              <div className="relative">
                <Campo
                  rotulo="Senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  obrigatorio
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((m) => !m)}
                  className="absolute right-2 bottom-1.5 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Botao type="submit" icone={Lock} carregando={enviando} className="w-full">
              Entrar
            </Botao>
          </form>
          <p className="mt-6 text-center text-xs text-slate-400">
            Esqueceu a senha? Solicite a redefinição ao administrador do sistema.
          </p>
          {MODO_DEMO && (
            <div className="mt-8 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Contas de exemplo</p>
              <p className="mt-1 text-xs text-slate-500">Senha de todas: <span className="font-mono text-slate-700 dark:text-slate-200">{SENHA_DEMO}</span></p>
              <div className="mt-3 grid gap-2">
                {CONTAS_DEMO.map((c) => (
                  <button
                    key={c.login}
                    type="button"
                    onClick={() => {
                      setLogin(c.login)
                      setSenha(SENHA_DEMO)
                      setErro(null)
                    }}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left text-sm transition hover:bg-blue-50 dark:bg-white/5 dark:hover:bg-blue-500/10"
                  >
                    <span className="font-mono">{c.login}</span>
                    <span className="text-xs text-slate-500">{c.perfil}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
