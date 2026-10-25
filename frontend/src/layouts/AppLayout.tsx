import { Bell, GraduationCap, KeyRound, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AvisoDemo } from '../components/AvisoDemo'
import { Confirmacao } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { dashboardService } from '../services/educonnect'
import type { Atividade } from '../types'
import { iniciais, tempoRelativo } from '../utils/formatar'
import { navegacao, rotuloPerfil } from './navegacao'

function Marca() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/30">
        <GraduationCap className="size-5" aria-hidden />
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-semibold text-white">EduConnect</p>
        <p className="text-[11px] text-marinho-300">Gestão Educacional</p>
      </div>
    </div>
  )
}

function MenuLateral({ aoNavegar, aoSair }: { aoNavegar?: () => void; aoSair: () => void }) {
  const { usuario } = useAuth()
  const itens = navegacao.filter((i) => usuario && i.perfis.includes(usuario.perfil))
  return (
    <div className="flex h-full flex-col bg-marinho-900 px-3 py-5 dark:bg-marinho-950 dark:ring-1 dark:ring-white/5">
      <Marca />
      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto" aria-label="Navegação principal">
        {itens.map((item) => (
          <NavLink
            key={item.caminho}
            to={item.caminho}
            end={item.caminho === '/'}
            onClick={aoNavegar}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-white/10 text-white shadow-inner shadow-white/5'
                  : 'text-marinho-200 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icone className="size-[18px] shrink-0" aria-hidden />
            <span className="truncate">{item.rotulo}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={aoSair}
        className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-marinho-200 transition hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-[18px]" aria-hidden />
        Sair
      </button>
    </div>
  )
}

function Notificacoes() {
  const [aberto, setAberto] = useState(false)
  const [atividades, setAtividades] = useState<Atividade[] | null>(null)
  const [erro, setErro] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    setErro(false)
    dashboardService
      .obter()
      .then((d) => setAtividades(d.atividadesRecentes))
      .catch(() => setErro(true))
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false)
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((a) => !a)}
        className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Atividades recentes"
        aria-expanded={aberto}
      >
        <Bell className="size-5" />
      </button>
      {aberto && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-marinho-900">
          <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-white/10">Atividades recentes</p>
          <div className="max-h-80 overflow-y-auto">
            {erro && <p className="px-4 py-6 text-center text-sm text-red-600">Não foi possível carregar.</p>}
            {!erro && atividades === null && <p className="px-4 py-6 text-center text-sm text-slate-500">Carregando…</p>}
            {atividades?.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-500">Nenhuma atividade registrada.</p>}
            {atividades?.map((a, i) => (
              <div key={i} className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-white/5">
                <p className="text-sm text-slate-700 dark:text-slate-200">{a.descricao}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {a.usuario ?? 'sistema'} · {tempoRelativo(a.criadoEm)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MenuPerfil({ aoSair }: { aoSair: () => void }) {
  const { usuario } = useAuth()
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false)
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  if (!usuario) return null
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((a) => !a)}
        className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-white/10"
        aria-expanded={aberto}
        aria-label="Menu do usuário"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-marinho-900 text-xs font-semibold text-white dark:bg-blue-600">
          {iniciais(usuario.nome) || '?'}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-40 truncate text-sm font-medium text-slate-800 dark:text-white">{usuario.nome}</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">{rotuloPerfil[usuario.perfil]}</span>
        </span>
      </button>
      {aberto && (
        <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-marinho-900">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-white/10">
            <p className="truncate text-sm font-medium">{usuario.nome}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {usuario.login} · {rotuloPerfil[usuario.perfil]}
            </p>
          </div>
          <button
            onClick={() => {
              setAberto(false)
              navigate('/configuracoes')
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <KeyRound className="size-4 text-slate-400" /> Alterar senha
          </button>
          <button
            onClick={() => {
              setAberto(false)
              aoSair()
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      )}
    </div>
  )
}

export function AppLayout() {
  const { usuario, sair } = useAuth()
  const { tema, alternar } = useTheme()
  const [menuAberto, setMenuAberto] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => setMenuAberto(false), [location.pathname])

  const podeBuscar = usuario?.perfil !== 'ALUNO'
  const pesquisar = (e: FormEvent) => {
    e.preventDefault()
    const termo = busca.trim()
    if (!termo) return
    const destino = usuario?.perfil === 'ADMINISTRADOR' ? '/alunos' : '/turmas'
    navigate(`${destino}?q=${encodeURIComponent(termo)}`)
    setBusca('')
  }

  const sairDoSistema = () => {
    setConfirmarSaida(false)
    sair()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh">
      {/* Menu lateral fixo (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <MenuLateral aoSair={() => setConfirmarSaida(true)} />
      </aside>

      {/* Menu lateral em gaveta (celular e tablet) */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-marinho-950/60" onClick={() => setMenuAberto(false)} aria-hidden />
          <aside className="relative h-full w-72 max-w-[85vw] shadow-2xl">
            <button
              onClick={() => setMenuAberto(false)}
              className="absolute top-5 right-3 z-10 rounded-lg p-1.5 text-marinho-200 hover:bg-white/10"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
            <MenuLateral aoNavegar={() => setMenuAberto(false)} aoSair={() => setConfirmarSaida(true)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <AvisoDemo />
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:gap-3 sm:px-6 dark:border-white/10 dark:bg-marinho-950/85">
          <button
            onClick={() => setMenuAberto(true)}
            className="flex size-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </button>

          {podeBuscar ? (
            <form onSubmit={pesquisar} className="relative min-w-0 flex-1 sm:max-w-md" role="search">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={usuario?.perfil === 'ADMINISTRADOR' ? 'Buscar aluno por nome ou matrícula' : 'Buscar turma'}
                aria-label="Pesquisar"
                className="h-10 w-full rounded-xl border border-transparent bg-slate-100 pr-3 pl-9 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:outline-none dark:bg-white/5 dark:focus:bg-marinho-900"
              />
            </form>
          ) : (
            <div className="flex-1" />
          )}

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              onClick={alternar}
              className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {tema === 'escuro' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            {podeBuscar && <Notificacoes />}
            <MenuPerfil aoSair={() => setConfirmarSaida(true)} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <Confirmacao
        aberto={confirmarSaida}
        titulo="Sair do EduConnect?"
        mensagem="Sua sessão será encerrada neste navegador."
        textoConfirmar="Sair"
        perigoso={false}
        aoConfirmar={sairDoSistema}
        aoCancelar={() => setConfirmarSaida(false)}
      />
    </div>
  )
}
