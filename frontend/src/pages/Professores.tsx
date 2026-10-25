import { Eye, Pencil, Plus, Power, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Botao, BotaoIcone } from '../components/ui/Botao'
import { Campo, CampoBusca } from '../components/ui/Campos'
import { Carregando, EstadoVazio, Etiqueta, EtiquetaAtivo, MensagemErro } from '../components/ui/Feedback'
import { BarraFiltros, CabecalhoPagina } from '../components/ui/Layout'
import { Confirmacao, Modal } from '../components/ui/Modal'
import { Paginacao, Tabela } from '../components/ui/Tabela'
import { useToast } from '../contexts/ToastContext'
import { useCarregar, useDebounce } from '../hooks/useCarregar'
import { MSG_LOGIN, MSG_SENHA, REGEX_LOGIN, REGEX_SENHA, useFormulario } from '../hooks/useFormulario'
import { ApiError } from '../services/api'
import { cursoService, professorService } from '../services/educonnect'
import type { CursoResumo, Professor } from '../types'
import { rotuloStatusTurma } from '../utils/formatar'

interface FormProfessor {
  nome: string
  registro: string
  especialidade: string
  login: string
  senha: string
  cursoIds: number[]
}

const vazio: FormProfessor = { nome: '', registro: '', especialidade: '', login: '', senha: '', cursoIds: [] }

function FormularioProfessor({
  aberto,
  professor,
  cursos,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean
  professor: Professor | null
  cursos: CursoResumo[]
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const f = useFormulario<FormProfessor>(vazio)
  const { reiniciar } = f

  useEffect(() => {
    if (!aberto) return
    reiniciar(
      professor
        ? {
            nome: professor.nome,
            registro: professor.registro,
            especialidade: professor.especialidade,
            login: professor.login,
            senha: '',
            cursoIds: professor.cursos.map((c) => c.id),
          }
        : vazio,
    )
  }, [aberto, professor, reiniciar])

  const opcoes = [...cursos, ...(professor?.cursos.filter((c) => !cursos.some((x) => x.id === c.id)) ?? [])]

  const validar = () => {
    const e: Record<string, string> = {}
    const v = f.valores
    if (!v.nome.trim()) e.nome = 'Informe o nome.'
    if (!v.registro.trim()) e.registro = 'Informe o registro profissional ou acadêmico.'
    if (!v.especialidade.trim()) e.especialidade = 'Informe a especialidade.'
    if (!REGEX_LOGIN.test(v.login.trim())) e.login = MSG_LOGIN
    if (!professor && !v.senha) e.senha = 'Informe a senha inicial.'
    if (v.senha && !REGEX_SENHA.test(v.senha)) e.senha = MSG_SENHA
    return e
  }

  const salvar = async () => {
    const v = f.valores
    const dados = {
      nome: v.nome.trim(),
      registro: v.registro.trim(),
      especialidade: v.especialidade.trim(),
      login: v.login.trim(),
      senha: v.senha || undefined,
      cursoIds: v.cursoIds,
    }
    const ok = await f.enviar(
      () => (professor ? professorService.atualizar(professor.id, dados) : professorService.criar(dados)),
      professor ? 'Professor atualizado.' : 'Professor cadastrado.',
      validar,
    )
    if (ok) aoSalvar()
  }

  const alternarCurso = (id: number) =>
    f.alterar('cursoIds', f.valores.cursoIds.includes(id) ? f.valores.cursoIds.filter((c) => c !== id) : [...f.valores.cursoIds, id])

  return (
    <Modal
      aberto={aberto}
      titulo={professor ? 'Editar professor' : 'Novo professor'}
      aoFechar={aoFechar}
      largura="lg"
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar} disabled={f.enviando}>
            Cancelar
          </Botao>
          <Botao onClick={salvar} carregando={f.enviando}>
            {professor ? 'Salvar alterações' : 'Cadastrar professor'}
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
        <Campo className="sm:col-span-2" rotulo="Nome completo" obrigatorio value={f.valores.nome} erro={f.erros.nome} onChange={(e) => f.alterar('nome', e.target.value)} maxLength={120} />
        <Campo rotulo="Registro" obrigatorio ajuda="Registro profissional ou acadêmico." value={f.valores.registro} erro={f.erros.registro} onChange={(e) => f.alterar('registro', e.target.value.toUpperCase())} maxLength={30} />
        <Campo rotulo="Especialidade" obrigatorio value={f.valores.especialidade} erro={f.erros.especialidade} onChange={(e) => f.alterar('especialidade', e.target.value)} maxLength={120} />
        <Campo rotulo="Login de acesso" obrigatorio autoComplete="off" value={f.valores.login} erro={f.erros.login} onChange={(e) => f.alterar('login', e.target.value)} maxLength={60} />
        <Campo
          rotulo={professor ? 'Nova senha' : 'Senha inicial'}
          type="password"
          autoComplete="new-password"
          obrigatorio={!professor}
          value={f.valores.senha}
          erro={f.erros.senha}
          ajuda={professor ? 'Deixe em branco para manter a senha atual.' : MSG_SENHA}
          onChange={(e) => f.alterar('senha', e.target.value)}
        />
        <fieldset className="sm:col-span-2">
          <legend className="rotulo">Cursos em que leciona</legend>
          {opcoes.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum curso ativo cadastrado.</p>
          ) : (
            <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2 dark:border-white/10">
              {opcoes.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-slate-300 accent-blue-600"
                    checked={f.valores.cursoIds.includes(c.id)}
                    onChange={() => alternarCurso(c.id)}
                  />
                  <span className="truncate">
                    {c.codigo} — {c.nome}
                  </span>
                </label>
              ))}
            </div>
          )}
          {f.erros.cursoIds && <p className="mt-1.5 text-xs text-red-600">{f.erros.cursoIds}</p>}
        </fieldset>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}

function TurmasDoProfessor({ professor, aoFechar }: { professor: Professor | null; aoFechar: () => void }) {
  const turmas = useCarregar(
    () => (professor ? professorService.turmas(professor.id) : Promise.resolve([])),
    [professor?.id],
  )
  return (
    <Modal aberto={!!professor} titulo={`Turmas de ${professor?.nome ?? ''}`} aoFechar={aoFechar}>
      {turmas.carregando && <Carregando />}
      {turmas.erro && <MensagemErro mensagem={turmas.erro} />}
      {turmas.dados?.length === 0 && <EstadoVazio titulo="Nenhuma turma vinculada" />}
      <ul className="divide-y divide-slate-100 dark:divide-white/10">
        {turmas.dados?.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <Link to={`/turmas/${t.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                {t.codigo}
              </Link>
              <p className="text-xs text-slate-500">
                {t.curso.nome} · {t.matriculados}/{t.capacidadeMaxima} alunos
              </p>
            </div>
            <Etiqueta cor={t.status === 'ABERTA' ? 'verde' : 'cinza'}>{rotuloStatusTurma[t.status]}</Etiqueta>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

export default function Professores() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca)
  const [cursoId, setCursoId] = useState('')
  const [pagina, setPagina] = useState(0)
  const [formAberto, setFormAberto] = useState(params.get('novo') === '1')
  const [editando, setEditando] = useState<Professor | null>(null)
  const [vendoTurmas, setVendoTurmas] = useState<Professor | null>(null)
  const [alternando, setAlternando] = useState<Professor | null>(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => setPagina(0), [termo, cursoId])

  const cursos = useCarregar(() => cursoService.ativos(), [])
  const lista = useCarregar(
    () =>
      professorService.listar({
        q: termo || undefined,
        cursoId: cursoId ? Number(cursoId) : undefined,
        page: pagina,
        size: 10,
        sort: 'nome',
      }),
    [termo, cursoId, pagina],
  )

  const fecharForm = () => {
    setFormAberto(false)
    setEditando(null)
    if (params.has('novo')) {
      params.delete('novo')
      setParams(params, { replace: true })
    }
  }

  const confirmarAlternancia = async () => {
    if (!alternando) return
    setProcessando(true)
    try {
      await professorService.alterarAtivo(alternando.id, !alternando.ativo)
      toast.sucesso(alternando.ativo ? 'Professor desativado.' : 'Professor reativado.')
      setAlternando(null)
      void lista.recarregar()
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível alterar o cadastro.')
    } finally {
      setProcessando(false)
    }
  }

  const dados = lista.dados

  return (
    <>
      <CabecalhoPagina
        titulo="Professores"
        descricao="Corpo docente, especialidades e cursos em que cada professor leciona."
        acoes={
          <Botao icone={Plus} onClick={() => setFormAberto(true)}>
            Novo professor
          </Botao>
        }
      />

      <div className="card overflow-hidden">
        <BarraFiltros>
          <CampoBusca className="sm:max-w-xs" placeholder="Nome, registro ou especialidade" aria-label="Buscar professor" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className="campo sm:max-w-56" aria-label="Filtrar por curso" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
            <option value="">Todos os cursos</option>
            {cursos.dados?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </BarraFiltros>

        {lista.erro && (
          <div className="p-4">
            <MensagemErro mensagem={lista.erro} aoTentarNovamente={lista.recarregar} />
          </div>
        )}
        {lista.carregando && !dados && <Carregando />}
        {dados?.conteudo.length === 0 && (
          <EstadoVazio icone={Users} titulo={termo || cursoId ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado'} />
        )}
        {dados && dados.conteudo.length > 0 && (
          <div className={lista.carregando ? 'opacity-60' : ''}>
            <Tabela
              itens={dados.conteudo}
              chave={(p) => p.id}
              colunas={[
                {
                  titulo: 'Professor',
                  celula: (p) => (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{p.nome}</p>
                      <p className="text-xs text-slate-500">{p.especialidade}</p>
                    </div>
                  ),
                },
                { titulo: 'Registro', celula: (p) => <span className="font-mono text-xs">{p.registro}</span>, ocultarNoCelular: true },
                {
                  titulo: 'Cursos',
                  ocultarNoCelular: true,
                  celula: (p) =>
                    p.cursos.length === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.cursos.map((c) => (
                          <Etiqueta key={c.id} cor="azul">
                            {c.codigo}
                          </Etiqueta>
                        ))}
                      </div>
                    ),
                },
                { titulo: 'Turmas', celula: (p) => p.quantidadeTurmas, ocultarNoCelular: true },
                { titulo: 'Situação', celula: (p) => <EtiquetaAtivo ativo={p.ativo} /> },
              ]}
              acoes={(p) => (
                <>
                  <BotaoIcone icone={Eye} rotulo="Turmas vinculadas" onClick={() => setVendoTurmas(p)} />
                  <BotaoIcone icone={Pencil} rotulo="Editar" onClick={() => setEditando(p)} />
                  <BotaoIcone icone={Power} rotulo={p.ativo ? 'Desativar' : 'Reativar'} onClick={() => setAlternando(p)} />
                </>
              )}
            />
            <Paginacao pagina={dados.pagina} totalPaginas={dados.totalPaginas} totalElementos={dados.totalElementos} aoMudar={setPagina} />
          </div>
        )}
      </div>

      <FormularioProfessor
        aberto={formAberto || !!editando}
        professor={editando}
        cursos={cursos.dados ?? []}
        aoFechar={fecharForm}
        aoSalvar={() => {
          fecharForm()
          void lista.recarregar()
        }}
      />
      <TurmasDoProfessor professor={vendoTurmas} aoFechar={() => setVendoTurmas(null)} />
      <Confirmacao
        aberto={!!alternando}
        titulo={alternando?.ativo ? 'Desativar professor?' : 'Reativar professor?'}
        mensagem={
          alternando?.ativo
            ? 'O professor perderá o acesso ao sistema. Não é possível desativar quem ainda é responsável por turmas abertas.'
            : 'O professor voltará a ter acesso ao sistema.'
        }
        textoConfirmar={alternando?.ativo ? 'Desativar' : 'Reativar'}
        perigoso={!!alternando?.ativo}
        carregando={processando}
        aoConfirmar={confirmarAlternancia}
        aoCancelar={() => setAlternando(null)}
      />
    </>
  )
}
