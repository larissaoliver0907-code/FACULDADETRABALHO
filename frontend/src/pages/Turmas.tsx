import { Pencil, Plus, School } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Botao, BotaoIcone } from '../components/ui/Botao'
import { Campo, CampoBusca, Selecao } from '../components/ui/Campos'
import { Carregando, EstadoVazio, Etiqueta, MensagemErro } from '../components/ui/Feedback'
import { BarraFiltros, CabecalhoPagina } from '../components/ui/Layout'
import { Modal } from '../components/ui/Modal'
import { Paginacao, Tabela } from '../components/ui/Tabela'
import { useAuth } from '../contexts/AuthContext'
import { useCarregar, useDebounce } from '../hooks/useCarregar'
import { MSG_CODIGO, REGEX_CODIGO, useFormulario } from '../hooks/useFormulario'
import { cursoService, professorService, turmaService } from '../services/educonnect'
import type { CursoResumo, StatusTurma, Turma } from '../types'
import { corStatusTurma, rotuloStatusTurma } from '../utils/formatar'

interface FormTurma {
  codigo: string
  cursoId: string
  professorId: string
  capacidadeMaxima: string
  status: StatusTurma
}

const vazio: FormTurma = { codigo: '', cursoId: '', professorId: '', capacidadeMaxima: '', status: 'ABERTA' }

export function FormularioTurma({
  aberto,
  turma,
  cursos,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean
  turma: Turma | null
  cursos: CursoResumo[]
  aoFechar: () => void
  aoSalvar: (t: Turma) => void
}) {
  const f = useFormulario<FormTurma>(vazio)
  const { reiniciar } = f
  const v = f.valores

  useEffect(() => {
    if (!aberto) return
    reiniciar(
      turma
        ? {
            codigo: turma.codigo,
            cursoId: String(turma.curso.id),
            professorId: turma.professor ? String(turma.professor.id) : '',
            capacidadeMaxima: String(turma.capacidadeMaxima),
            status: turma.status,
          }
        : vazio,
    )
  }, [aberto, turma, reiniciar])

  // Somente professores ativos associados ao curso selecionado.
  const professores = useCarregar(
    () =>
      v.cursoId
        ? professorService.listar({ cursoId: Number(v.cursoId), ativo: true, size: 100, sort: 'nome' }).then((p) => p.conteudo)
        : Promise.resolve([]),
    [v.cursoId],
  )

  const validar = () => {
    const e: Record<string, string> = {}
    if (!REGEX_CODIGO.test(v.codigo.trim())) e.codigo = MSG_CODIGO
    if (!v.cursoId) e.cursoId = 'Selecione o curso.'
    const cap = Number(v.capacidadeMaxima)
    if (!Number.isInteger(cap) || cap < 1) e.capacidadeMaxima = 'Informe um número inteiro maior que zero.'
    if (turma && cap < turma.matriculados) e.capacidadeMaxima = `A turma já possui ${turma.matriculados} alunos.`
    return e
  }

  const salvar = async () => {
    let salva: Turma | undefined
    const dados = {
      codigo: v.codigo.trim(),
      cursoId: Number(v.cursoId),
      professorId: v.professorId ? Number(v.professorId) : null,
      capacidadeMaxima: Number(v.capacidadeMaxima),
      status: v.status,
    }
    const ok = await f.enviar(
      async () => {
        salva = turma ? await turmaService.atualizar(turma.id, dados) : await turmaService.criar(dados)
      },
      turma ? 'Turma atualizada.' : 'Turma criada.',
      validar,
    )
    if (ok && salva) aoSalvar(salva)
  }

  const opcoesCurso = turma && !cursos.some((c) => c.id === turma.curso.id) ? [turma.curso, ...cursos] : cursos

  return (
    <Modal
      aberto={aberto}
      titulo={turma ? 'Editar turma' : 'Nova turma'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar} disabled={f.enviando}>
            Cancelar
          </Botao>
          <Botao onClick={salvar} carregando={f.enviando}>
            {turma ? 'Salvar alterações' : 'Criar turma'}
          </Botao>
        </>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
      >
        <Campo rotulo="Código" obrigatorio ajuda="Ex.: ADS-2026A" value={v.codigo} erro={f.erros.codigo} onChange={(e) => f.alterar('codigo', e.target.value.toUpperCase())} maxLength={20} />
        <Campo rotulo="Capacidade máxima" obrigatorio type="number" inputMode="numeric" min={1} value={v.capacidadeMaxima} erro={f.erros.capacidadeMaxima} onChange={(e) => f.alterar('capacidadeMaxima', e.target.value)} />
        <Selecao
          className="sm:col-span-2"
          rotulo="Curso"
          obrigatorio
          value={v.cursoId}
          erro={f.erros.cursoId}
          ajuda={turma && turma.matriculados > 0 ? 'O curso não pode ser trocado com alunos matriculados.' : undefined}
          disabled={!!turma && turma.matriculados > 0}
          onChange={(e) => {
            f.alterar('cursoId', e.target.value)
            f.alterar('professorId', '')
          }}
        >
          <option value="">Selecione…</option>
          {opcoesCurso.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} — {c.nome}
            </option>
          ))}
        </Selecao>
        <Selecao
          className="sm:col-span-2"
          rotulo="Professor responsável"
          value={v.professorId}
          erro={f.erros.professorId}
          disabled={!v.cursoId}
          ajuda={v.cursoId && professores.dados?.length === 0 ? 'Nenhum professor ativo associado a este curso.' : 'Apenas professores que lecionam no curso.'}
          onChange={(e) => f.alterar('professorId', e.target.value)}
        >
          <option value="">Sem professor por enquanto</option>
          {professores.dados?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} ({p.registro})
            </option>
          ))}
        </Selecao>
        <Selecao className="sm:col-span-2" rotulo="Status" value={v.status} onChange={(e) => f.alterar('status', e.target.value as StatusTurma)}>
          <option value="ABERTA">Aberta — aceita matrículas e avaliações</option>
          <option value="ENCERRADA">Encerrada</option>
          <option value="CANCELADA">Cancelada</option>
        </Selecao>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}

export default function Turmas() {
  const { temPerfil } = useAuth()
  const admin = temPerfil('ADMINISTRADOR')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [busca, setBusca] = useState(params.get('q') ?? '')
  const termo = useDebounce(busca)
  const [cursoId, setCursoId] = useState('')
  const [status, setStatus] = useState<'' | StatusTurma>('')
  const [pagina, setPagina] = useState(0)
  const [formAberto, setFormAberto] = useState(params.get('novo') === '1' && admin)
  const [editando, setEditando] = useState<Turma | null>(null)

  useEffect(() => setBusca(params.get('q') ?? ''), [params])
  useEffect(() => setPagina(0), [termo, cursoId, status])

  const cursos = useCarregar(() => cursoService.ativos(), [])
  const lista = useCarregar(
    () =>
      turmaService.listar({
        q: termo || undefined,
        cursoId: cursoId ? Number(cursoId) : undefined,
        status: status || undefined,
        page: pagina,
        size: 10,
        sort: 'codigo',
      }),
    [termo, cursoId, status, pagina],
  )

  const fecharForm = () => {
    setFormAberto(false)
    setEditando(null)
    if (params.has('novo')) {
      params.delete('novo')
      setParams(params, { replace: true })
    }
  }

  const dados = lista.dados

  return (
    <>
      <CabecalhoPagina
        titulo={admin ? 'Turmas' : 'Minhas turmas'}
        descricao={admin ? 'Turmas, vagas, professores responsáveis e matrículas.' : 'Turmas sob sua responsabilidade.'}
        acoes={
          admin && (
            <Botao icone={Plus} onClick={() => setFormAberto(true)}>
              Nova turma
            </Botao>
          )
        }
      />

      <div className="card overflow-hidden">
        <BarraFiltros>
          <CampoBusca className="sm:max-w-xs" placeholder="Código ou curso" aria-label="Buscar turma" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className="campo sm:max-w-56" aria-label="Filtrar por curso" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
            <option value="">Todos os cursos</option>
            {cursos.dados?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <select className="campo sm:max-w-40" aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value as '' | StatusTurma)}>
            <option value="">Todos os status</option>
            <option value="ABERTA">Abertas</option>
            <option value="ENCERRADA">Encerradas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </BarraFiltros>

        {lista.erro && (
          <div className="p-4">
            <MensagemErro mensagem={lista.erro} aoTentarNovamente={lista.recarregar} />
          </div>
        )}
        {lista.carregando && !dados && <Carregando />}
        {dados?.conteudo.length === 0 && (
          <EstadoVazio
            icone={School}
            titulo={termo || cursoId || status ? 'Nenhuma turma encontrada' : admin ? 'Nenhuma turma cadastrada' : 'Nenhuma turma atribuída a você'}
          />
        )}
        {dados && dados.conteudo.length > 0 && (
          <div className={lista.carregando ? 'opacity-60' : ''}>
            <Tabela
              itens={dados.conteudo}
              chave={(t) => t.id}
              aoClicarLinha={(t) => navigate(`/turmas/${t.id}`)}
              colunas={[
                {
                  titulo: 'Turma',
                  celula: (t) => (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{t.codigo}</p>
                      <p className="text-xs text-slate-500">{t.curso.nome}</p>
                    </div>
                  ),
                },
                { titulo: 'Professor', celula: (t) => t.professor?.nome ?? <span className="text-slate-400">Sem professor</span>, ocultarNoCelular: true },
                {
                  titulo: 'Ocupação',
                  celula: (t) => {
                    const pct = Math.round((t.matriculados / t.capacidadeMaxima) * 100)
                    return (
                      <div className="min-w-28">
                        <div className="flex justify-between text-xs tabular-nums">
                          <span>
                            {t.matriculados}/{t.capacidadeMaxima}
                          </span>
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )
                  },
                },
                { titulo: 'Status', celula: (t) => <Etiqueta cor={corStatusTurma[t.status]}>{rotuloStatusTurma[t.status]}</Etiqueta>, ocultarNoCelular: true },
              ]}
              acoes={admin ? (t) => <BotaoIcone icone={Pencil} rotulo="Editar" onClick={() => setEditando(t)} /> : undefined}
            />
            <Paginacao pagina={dados.pagina} totalPaginas={dados.totalPaginas} totalElementos={dados.totalElementos} aoMudar={setPagina} />
          </div>
        )}
      </div>

      {admin && (
        <FormularioTurma
          aberto={formAberto || !!editando}
          turma={editando}
          cursos={cursos.dados ?? []}
          aoFechar={fecharForm}
          aoSalvar={(t) => {
            const nova = !editando
            fecharForm()
            void lista.recarregar()
            if (nova) navigate(`/turmas/${t.id}`)
          }}
        />
      )}
    </>
  )
}
