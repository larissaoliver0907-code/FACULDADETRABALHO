import { Eye, GraduationCap, Pencil, Plus, Power } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Botao, BotaoIcone } from '../components/ui/Botao'
import { CampoBusca, Campo, Selecao } from '../components/ui/Campos'
import { Carregando, EstadoVazio, EtiquetaAtivo, MensagemErro } from '../components/ui/Feedback'
import { BarraFiltros, CabecalhoPagina } from '../components/ui/Layout'
import { Confirmacao, Modal } from '../components/ui/Modal'
import { Paginacao, Tabela } from '../components/ui/Tabela'
import { useToast } from '../contexts/ToastContext'
import { useCarregar, useDebounce } from '../hooks/useCarregar'
import { MSG_LOGIN, MSG_SENHA, REGEX_LOGIN, REGEX_SENHA, useFormulario } from '../hooks/useFormulario'
import { ApiError } from '../services/api'
import { alunoService, cursoService } from '../services/educonnect'
import type { Aluno, CursoResumo } from '../types'

interface FormAluno {
  nome: string
  matricula: string
  cursoId: string
  login: string
  senha: string
}

const vazio: FormAluno = { nome: '', matricula: '', cursoId: '', login: '', senha: '' }

export function FormularioAluno({
  aberto,
  aluno,
  cursos,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean
  aluno: Aluno | null
  cursos: CursoResumo[]
  aoFechar: () => void
  aoSalvar: (a: Aluno) => void
}) {
  const f = useFormulario<FormAluno>(vazio)
  const { reiniciar } = f

  useEffect(() => {
    if (!aberto) return
    reiniciar(
      aluno
        ? { nome: aluno.nome, matricula: aluno.matricula, cursoId: String(aluno.curso.id), login: aluno.login, senha: '' }
        : vazio,
    )
  }, [aberto, aluno, reiniciar])

  const validar = () => {
    const e: Record<string, string> = {}
    const v = f.valores
    if (!v.nome.trim()) e.nome = 'Informe o nome.'
    if (!/^[A-Za-z0-9]{4,20}$/.test(v.matricula.trim())) e.matricula = 'De 4 a 20 letras ou números.'
    if (!v.cursoId) e.cursoId = 'Selecione o curso.'
    if (!REGEX_LOGIN.test(v.login.trim())) e.login = MSG_LOGIN
    if (!aluno && !v.senha) e.senha = 'Informe a senha inicial.'
    if (v.senha && !REGEX_SENHA.test(v.senha)) e.senha = MSG_SENHA
    return e
  }

  const salvar = async () => {
    let salvo: Aluno | null = null
    const dados = {
      nome: f.valores.nome.trim(),
      matricula: f.valores.matricula.trim(),
      cursoId: Number(f.valores.cursoId),
      login: f.valores.login.trim(),
      senha: f.valores.senha || undefined,
    }
    const ok = await f.enviar(
      async () => {
        salvo = aluno ? await alunoService.atualizar(aluno.id, dados) : await alunoService.criar(dados)
      },
      aluno ? 'Aluno atualizado.' : 'Aluno cadastrado.',
      validar,
    )
    if (ok && salvo) aoSalvar(salvo)
  }

  // Inclui o curso atual do aluno mesmo que tenha sido inativado.
  const opcoes = aluno && !cursos.some((c) => c.id === aluno.curso.id) ? [aluno.curso, ...cursos] : cursos

  return (
    <Modal
      aberto={aberto}
      titulo={aluno ? 'Editar aluno' : 'Novo aluno'}
      descricao={aluno ? `Matrícula ${aluno.matricula}` : 'Os campos com * são obrigatórios.'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar} disabled={f.enviando}>
            Cancelar
          </Botao>
          <Botao onClick={salvar} carregando={f.enviando}>
            {aluno ? 'Salvar alterações' : 'Cadastrar aluno'}
          </Botao>
        </>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
        noValidate
      >
        <Campo className="sm:col-span-2" rotulo="Nome completo" obrigatorio value={f.valores.nome} erro={f.erros.nome} onChange={(e) => f.alterar('nome', e.target.value)} maxLength={120} />
        <Campo rotulo="Matrícula" obrigatorio value={f.valores.matricula} erro={f.erros.matricula} onChange={(e) => f.alterar('matricula', e.target.value.toUpperCase())} maxLength={20} />
        <Selecao rotulo="Curso" obrigatorio value={f.valores.cursoId} erro={f.erros.cursoId} onChange={(e) => f.alterar('cursoId', e.target.value)}>
          <option value="">Selecione…</option>
          {opcoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} — {c.nome}
            </option>
          ))}
        </Selecao>
        <Campo rotulo="Login de acesso" obrigatorio autoComplete="off" value={f.valores.login} erro={f.erros.login} onChange={(e) => f.alterar('login', e.target.value)} maxLength={60} />
        <Campo
          rotulo={aluno ? 'Nova senha' : 'Senha inicial'}
          type="password"
          autoComplete="new-password"
          obrigatorio={!aluno}
          value={f.valores.senha}
          erro={f.erros.senha}
          ajuda={aluno ? 'Deixe em branco para manter a senha atual.' : MSG_SENHA}
          onChange={(e) => f.alterar('senha', e.target.value)}
        />
        <button type="submit" className="hidden" />
      </form>
      {cursos.length === 0 && (
        <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">Nenhum curso ativo. Cadastre um curso antes de cadastrar alunos.</p>
      )}
    </Modal>
  )
}

export default function Alunos() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [busca, setBusca] = useState(params.get('q') ?? '')
  const termo = useDebounce(busca)
  const [cursoId, setCursoId] = useState('')
  const [ativo, setAtivo] = useState('')
  const [pagina, setPagina] = useState(0)
  const [formAberto, setFormAberto] = useState(params.get('novo') === '1')
  const [editando, setEditando] = useState<Aluno | null>(null)
  const [alternando, setAlternando] = useState<Aluno | null>(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => setBusca(params.get('q') ?? ''), [params])
  useEffect(() => setPagina(0), [termo, cursoId, ativo])

  const cursos = useCarregar(() => cursoService.ativos(), [])
  const lista = useCarregar(
    () =>
      alunoService.listar({
        q: termo || undefined,
        cursoId: cursoId ? Number(cursoId) : undefined,
        ativo: ativo === '' ? undefined : ativo === 'true',
        page: pagina,
        size: 10,
        sort: 'nome',
      }),
    [termo, cursoId, ativo, pagina],
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
      await alunoService.alterarAtivo(alternando.id, !alternando.ativo)
      toast.sucesso(alternando.ativo ? 'Aluno desativado. O histórico foi preservado.' : 'Aluno reativado.')
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
        titulo="Alunos"
        descricao="Cadastro, matrícula e acompanhamento acadêmico dos alunos."
        acoes={
          <Botao icone={Plus} onClick={() => setFormAberto(true)}>
            Novo aluno
          </Botao>
        }
      />

      <div className="card overflow-hidden">
        <BarraFiltros>
          <CampoBusca
            className="sm:max-w-xs"
            placeholder="Nome ou matrícula"
            aria-label="Buscar por nome ou matrícula"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select className="campo sm:max-w-56" aria-label="Filtrar por curso" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
            <option value="">Todos os cursos</option>
            {cursos.dados?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <select className="campo sm:max-w-40" aria-label="Filtrar por situação" value={ativo} onChange={(e) => setAtivo(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </BarraFiltros>

        {lista.erro && (
          <div className="p-4">
            <MensagemErro mensagem={lista.erro} aoTentarNovamente={lista.recarregar} />
          </div>
        )}
        {lista.carregando && !dados && <Carregando />}
        {dados && dados.conteudo.length === 0 && (
          <EstadoVazio
            icone={GraduationCap}
            titulo={termo || cursoId || ativo ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            descricao={termo || cursoId || ativo ? 'Ajuste os filtros da busca.' : 'Cadastre o primeiro aluno para começar.'}
          />
        )}
        {dados && dados.conteudo.length > 0 && (
          <div className={lista.carregando ? 'opacity-60 transition' : ''}>
            <Tabela
              itens={dados.conteudo}
              chave={(a) => a.id}
              aoClicarLinha={(a) => navigate(`/alunos/${a.id}`)}
              colunas={[
                {
                  titulo: 'Aluno',
                  celula: (a) => (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{a.nome}</p>
                      <p className="text-xs text-slate-500 md:hidden">{a.matricula}</p>
                    </div>
                  ),
                },
                { titulo: 'Matrícula', celula: (a) => <span className="font-mono text-xs">{a.matricula}</span>, ocultarNoCelular: true },
                { titulo: 'Curso', celula: (a) => a.curso.nome, ocultarNoCelular: true },
                { titulo: 'Situação', celula: (a) => <EtiquetaAtivo ativo={a.ativo} /> },
              ]}
              acoes={(a) => (
                <>
                  <BotaoIcone icone={Eye} rotulo="Ver detalhes" onClick={() => navigate(`/alunos/${a.id}`)} />
                  <BotaoIcone icone={Pencil} rotulo="Editar" onClick={() => setEditando(a)} />
                  <BotaoIcone
                    icone={Power}
                    rotulo={a.ativo ? 'Desativar' : 'Reativar'}
                    className={a.ativo ? 'hover:!text-red-600' : 'hover:!text-emerald-600'}
                    onClick={() => setAlternando(a)}
                  />
                </>
              )}
            />
            <Paginacao pagina={dados.pagina} totalPaginas={dados.totalPaginas} totalElementos={dados.totalElementos} aoMudar={setPagina} />
          </div>
        )}
      </div>

      <FormularioAluno
        aberto={formAberto || !!editando}
        aluno={editando}
        cursos={cursos.dados ?? []}
        aoFechar={fecharForm}
        aoSalvar={(a) => {
          fecharForm()
          void lista.recarregar()
          if (!editando) navigate(`/alunos/${a.id}`)
        }}
      />

      <Confirmacao
        aberto={!!alternando}
        titulo={alternando?.ativo ? 'Desativar aluno?' : 'Reativar aluno?'}
        mensagem={
          alternando?.ativo ? (
            <>
              <strong>{alternando.nome}</strong> perderá o acesso ao sistema e não poderá ser matriculado em novas turmas. O
              histórico acadêmico e as notas serão preservados.
            </>
          ) : (
            <>
              <strong>{alternando?.nome}</strong> voltará a ter acesso ao sistema.
            </>
          )
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
