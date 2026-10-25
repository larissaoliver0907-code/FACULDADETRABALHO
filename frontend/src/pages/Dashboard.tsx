import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Plus,
  School,
  Star,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EstadoVazio, Esqueleto, MensagemErro } from '../components/ui/Feedback'
import { CabecalhoPagina, Cartao, Indicador } from '../components/ui/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCarregar } from '../hooks/useCarregar'
import { dashboardService } from '../services/educonnect'
import { formatarNota, tempoRelativo } from '../utils/formatar'

const CORES_SITUACAO: Record<string, string> = {
  Aprovado: '#10b981',
  Recuperação: '#f59e0b',
  Reprovado: '#ef4444',
  'Critério não configurado': '#3b82f6',
  'Avaliações insuficientes': '#94a3b8',
  'Sem avaliações': '#cbd5e1',
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const { tema } = useTheme()
  const { dados, carregando, erro, recarregar } = useCarregar(() => dashboardService.obter(), [])
  const admin = usuario?.perfil === 'ADMINISTRADOR'
  const corEixo = tema === 'escuro' ? '#94a3b8' : '#64748b'
  const corGrade = tema === 'escuro' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'
  const estiloTooltip = {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 10px 30px rgba(15,33,71,0.15)',
    background: tema === 'escuro' ? '#182c56' : '#fff',
    color: tema === 'escuro' ? '#fff' : '#0f172a',
  }

  const atalhos = [
    { rotulo: 'Novo aluno', caminho: '/alunos?novo=1', icone: UserPlus },
    { rotulo: 'Novo professor', caminho: '/professores?novo=1', icone: Users },
    { rotulo: 'Novo curso', caminho: '/cursos?novo=1', icone: BookOpen },
    { rotulo: 'Nova turma', caminho: '/turmas?novo=1', icone: School },
  ]

  return (
    <>
      <CabecalhoPagina
        titulo={`Olá, ${usuario?.nome.split(' ')[0] ?? ''}`}
        descricao="Visão geral da instituição calculada a partir dos dados cadastrados."
      />

      {erro && <MensagemErro mensagem={erro} aoTentarNovamente={recarregar} />}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        {carregando && !dados
          ? Array.from({ length: 6 }).map((_, i) => <Esqueleto key={i} className="h-24 rounded-2xl" />)
          : dados && (
              <>
                <Indicador rotulo="Alunos ativos" valor={dados.totalAlunos} icone={GraduationCap} destaque="azul" />
                <Indicador rotulo="Professores ativos" valor={dados.totalProfessores} icone={Users} destaque="violeta" />
                <Indicador rotulo="Cursos" valor={dados.totalCursos} icone={BookOpen} destaque="marinho" />
                <Indicador rotulo="Turmas" valor={dados.totalTurmas} icone={School} destaque="ciano" />
                <Indicador
                  rotulo="Média geral"
                  valor={formatarNota(dados.mediaGeral)}
                  icone={Star}
                  destaque="ambar"
                  detalhe={dados.mediaGeral === null ? 'Sem avaliações' : 'Todas as avaliações'}
                />
                <Indicador rotulo="Matrículas ativas" valor={dados.matriculasAtivas} icone={ClipboardCheck} destaque="verde" detalhe="Em turmas abertas" />
              </>
            )}
      </div>

      {admin && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {atalhos.map(({ rotulo, caminho, icone: Icone }) => (
            <Link
              key={caminho}
              to={caminho}
              className="card group flex items-center gap-3 p-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:shadow-md dark:text-slate-200 dark:hover:border-blue-500/50"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-blue-500 group-hover:text-white dark:bg-white/5">
                <Icone className="size-4" />
              </span>
              <span className="flex-1">{rotulo}</span>
              <Plus className="size-4 text-slate-300 group-hover:text-blue-500" />
            </Link>
          ))}
        </div>
      )}

      {dados && (
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <Cartao titulo="Alunos ativos por curso" className="xl:col-span-2">
            {dados.alunosPorCurso.length === 0 ? (
              <EstadoVazio titulo="Nenhum aluno ativo" descricao="Cadastre alunos para ver a distribuição por curso." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados.alunosPorCurso} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={corGrade} vertical={false} />
                    <XAxis
                      dataKey="rotulo"
                      tick={{ fill: corEixo, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 16)}…` : v)}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: corEixo, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={estiloTooltip} cursor={{ fill: corGrade }} formatter={(v) => [v, 'Alunos']} />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Cartao>

          <Cartao titulo="Situação acadêmica" descricao="Por aluno em cada turma avaliada">
            {dados.situacaoAcademica.length === 0 ? (
              <EstadoVazio titulo="Sem avaliações lançadas" />
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dados.situacaoAcademica} dataKey="valor" nameKey="rotulo" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {dados.situacaoAcademica.map((s) => (
                          <Cell key={s.rotulo} fill={CORES_SITUACAO[s.rotulo] ?? '#64748b'} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={estiloTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {dados.situacaoAcademica.map((s) => (
                    <li key={s.rotulo} className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: CORES_SITUACAO[s.rotulo] ?? '#64748b' }} />
                      <span className="flex-1 text-slate-600 dark:text-slate-300">{s.rotulo}</span>
                      <span className="font-medium tabular-nums">{s.valor}</span>
                    </li>
                  ))}
                </ul>
                {!dados.criterioConfigurado && (
                  <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
                    A média de aprovação ainda não foi configurada.{' '}
                    {admin && (
                      <Link to="/configuracoes" className="font-medium underline">
                        Configurar critérios
                      </Link>
                    )}
                  </p>
                )}
              </>
            )}
          </Cartao>

          <Cartao titulo="Desempenho acadêmico" descricao="Distribuição de todas as notas lançadas" className="xl:col-span-2">
            {dados.distribuicaoNotas.every((f) => f.valor === 0) ? (
              <EstadoVazio titulo="Nenhuma nota lançada" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados.distribuicaoNotas} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={corGrade} vertical={false} />
                    <XAxis dataKey="rotulo" tick={{ fill: corEixo, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: corEixo, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={estiloTooltip} cursor={{ fill: corGrade }} formatter={(v) => [v, 'Notas']} />
                    <Bar dataKey="valor" fill={tema === 'escuro' ? '#60a5fa' : '#0f2147'} radius={[8, 8, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Cartao>

          <Cartao titulo="Atividades recentes" semPadding>
            {dados.atividadesRecentes.length === 0 ? (
              <EstadoVazio titulo="Nenhuma atividade" descricao="As ações realizadas no sistema aparecem aqui." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {dados.atividadesRecentes.map((a, i) => (
                  <li key={i} className="flex gap-3 px-5 py-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{a.descricao}</p>
                      <p className="text-xs text-slate-400">
                        {a.usuario ?? 'sistema'} · {tempoRelativo(a.criadoEm)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      )}
    </>
  )
}
