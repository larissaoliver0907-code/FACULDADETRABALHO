import { BookOpen, Monitor, Pencil, Plus, Power, School } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Botao, BotaoIcone } from '../components/ui/Botao'
import { AreaTexto, Campo, CampoBusca } from '../components/ui/Campos'
import { Carregando, EstadoVazio, Etiqueta, MensagemErro } from '../components/ui/Feedback'
import { BarraFiltros, CabecalhoPagina } from '../components/ui/Layout'
import { Confirmacao, Modal } from '../components/ui/Modal'
import { Paginacao, Tabela } from '../components/ui/Tabela'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useCarregar, useDebounce } from '../hooks/useCarregar'
import { MSG_CODIGO, REGEX_CODIGO, useFormulario } from '../hooks/useFormulario'
import { ApiError } from '../services/api'
import { cursoService } from '../services/educonnect'
import type { Curso, Modalidade, StatusCurso } from '../types'
import { rotuloStatusTurma } from '../utils/formatar'

interface FormCurso {
  codigo: string
  nome: string
  cargaHoraria: string
  descricao: string
  modalidade: Modalidade
  sala: string
  plataforma: string
}

const vazio: FormCurso = { codigo: '', nome: '', cargaHoraria: '', descricao: '', modalidade: 'PRESENCIAL', sala: '', plataforma: '' }

function FormularioCurso({ aberto, curso, aoFechar, aoSalvar }: { aberto: boolean; curso: Curso | null; aoFechar: () => void; aoSalvar: () => void }) {
  const f = useFormulario<FormCurso>(vazio)
  const { reiniciar } = f

  useEffect(() => {
    if (!aberto) return
    reiniciar(
      curso
        ? {
            codigo: curso.codigo,
            nome: curso.nome,
            cargaHoraria: String(curso.cargaHoraria),
            descricao: curso.descricao ?? '',
            modalidade: curso.modalidade,
            sala: curso.sala ?? '',
            plataforma: curso.plataforma ?? '',
          }
        : vazio,
    )
  }, [aberto, curso, reiniciar])

  const v = f.valores
  const validar = () => {
    const e: Record<string, string> = {}
    if (!REGEX_CODIGO.test(v.codigo.trim())) e.codigo = MSG_CODIGO
    if (!v.nome.trim()) e.nome = 'Informe o nome.'
    const ch = Number(v.cargaHoraria)
    if (!Number.isInteger(ch) || ch <= 0) e.cargaHoraria = 'Informe um número inteiro maior que zero.'
    if (v.modalidade === 'PRESENCIAL' && !v.sala.trim()) e.sala = 'Informe a sala de aula.'
    if (v.modalidade === 'EAD' && !v.plataforma.trim()) e.plataforma = 'Informe a plataforma virtual.'
    return e
  }

  const salvar = async () => {
    const dados = {
      codigo: v.codigo.trim(),
      nome: v.nome.trim(),
      cargaHoraria: Number(v.cargaHoraria),
      descricao: v.descricao.trim() || undefined,
      modalidade: v.modalidade,
      sala: v.modalidade === 'PRESENCIAL' ? v.sala.trim() : undefined,
      plataforma: v.modalidade === 'EAD' ? v.plataforma.trim() : undefined,
    }
    const ok = await f.enviar(
      () => (curso ? cursoService.atualizar(curso.id, dados) : cursoService.criar(dados)),
      curso ? 'Curso atualizado.' : 'Curso cadastrado.',
      validar,
    )
    if (ok) aoSalvar()
  }

  return (
    <Modal
      aberto={aberto}
      titulo={curso ? 'Editar curso' : 'Novo curso'}
      aoFechar={aoFechar}
      largura="lg"
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar} disabled={f.enviando}>
            Cancelar
          </Botao>
          <Botao onClick={salvar} carregando={f.enviando}>
            {curso ? 'Salvar alterações' : 'Cadastrar curso'}
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
        <fieldset className="sm:col-span-2">
          <legend className="rotulo">Modalidade</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['PRESENCIAL', 'Presencial', School],
                ['EAD', 'EAD', Monitor],
              ] as const
            ).map(([valor, rotulo, Icone]) => (
              <label
                key={valor}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium transition ${
                  v.modalidade === valor
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-4 ring-blue-500/10 dark:bg-blue-500/10 dark:text-blue-200'
                    : 'border-slate-200 dark:border-white/10'
                } ${curso ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="modalidade"
                  value={valor}
                  checked={v.modalidade === valor}
                  disabled={!!curso}
                  onChange={() => f.alterar('modalidade', valor)}
                />
                <Icone className="size-4" />
                {rotulo}
              </label>
            ))}
          </div>
          {curso && <p className="mt-1.5 text-xs text-slate-500">A modalidade não pode ser alterada após o cadastro.</p>}
        </fieldset>
        <Campo rotulo="Código" obrigatorio value={v.codigo} erro={f.erros.codigo} ajuda="Único. Ex.: ADS, ENG-CIVIL" onChange={(e) => f.alterar('codigo', e.target.value.toUpperCase())} maxLength={20} />
        <Campo rotulo="Carga horária (horas)" obrigatorio type="number" inputMode="numeric" min={1} value={v.cargaHoraria} erro={f.erros.cargaHoraria} onChange={(e) => f.alterar('cargaHoraria', e.target.value)} />
        <Campo className="sm:col-span-2" rotulo="Nome do curso" obrigatorio value={v.nome} erro={f.erros.nome} onChange={(e) => f.alterar('nome', e.target.value)} maxLength={120} />
        {v.modalidade === 'PRESENCIAL' ? (
          <Campo className="sm:col-span-2" rotulo="Sala de aula" obrigatorio value={v.sala} erro={f.erros.sala} onChange={(e) => f.alterar('sala', e.target.value)} maxLength={60} />
        ) : (
          <Campo className="sm:col-span-2" rotulo="Plataforma virtual" obrigatorio placeholder="Ex.: Moodle, Google Classroom" value={v.plataforma} erro={f.erros.plataforma} onChange={(e) => f.alterar('plataforma', e.target.value)} maxLength={120} />
        )}
        <AreaTexto className="sm:col-span-2" rotulo="Descrição" value={v.descricao} erro={f.erros.descricao} onChange={(e) => f.alterar('descricao', e.target.value)} maxLength={1000} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}

function TurmasDoCurso({ curso, aoFechar }: { curso: Curso | null; aoFechar: () => void }) {
  const turmas = useCarregar(() => (curso ? cursoService.turmas(curso.id) : Promise.resolve([])), [curso?.id])
  return (
    <Modal aberto={!!curso} titulo={`Turmas de ${curso?.nome ?? ''}`} aoFechar={aoFechar}>
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
                {t.professor?.nome ?? 'Sem professor'} · {t.matriculados}/{t.capacidadeMaxima} alunos
              </p>
            </div>
            <Etiqueta cor={t.status === 'ABERTA' ? 'verde' : 'cinza'}>{rotuloStatusTurma[t.status]}</Etiqueta>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

export default function Cursos() {
  const { temPerfil } = useAuth()
  const admin = temPerfil('ADMINISTRADOR')
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca)
  const [status, setStatus] = useState<'' | StatusCurso>('')
  const [modalidade, setModalidade] = useState<'' | Modalidade>('')
  const [pagina, setPagina] = useState(0)
  const [formAberto, setFormAberto] = useState(params.get('novo') === '1' && admin)
  const [editando, setEditando] = useState<Curso | null>(null)
  const [vendoTurmas, setVendoTurmas] = useState<Curso | null>(null)
  const [alternando, setAlternando] = useState<Curso | null>(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => setPagina(0), [termo, status, modalidade])

  const lista = useCarregar(
    () =>
      cursoService.listar({
        q: termo || undefined,
        status: status || undefined,
        modalidade: modalidade || undefined,
        page: pagina,
        size: 10,
        sort: 'nome',
      }),
    [termo, status, modalidade, pagina],
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
      const novo: StatusCurso = alternando.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'
      await cursoService.alterarStatus(alternando.id, novo)
      toast.sucesso(novo === 'ATIVO' ? 'Curso ativado.' : 'Curso inativado.')
      setAlternando(null)
      void lista.recarregar()
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível alterar o status.')
    } finally {
      setProcessando(false)
    }
  }

  const dados = lista.dados

  return (
    <>
      <CabecalhoPagina
        titulo="Cursos"
        descricao="Cursos presenciais e EAD oferecidos pela instituição."
        acoes={
          admin && (
            <Botao icone={Plus} onClick={() => setFormAberto(true)}>
              Novo curso
            </Botao>
          )
        }
      />

      <div className="card overflow-hidden">
        <BarraFiltros>
          <CampoBusca className="sm:max-w-xs" placeholder="Nome ou código" aria-label="Buscar curso" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className="campo sm:max-w-44" aria-label="Filtrar por modalidade" value={modalidade} onChange={(e) => setModalidade(e.target.value as '' | Modalidade)}>
            <option value="">Todas as modalidades</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="EAD">EAD</option>
          </select>
          <select className="campo sm:max-w-40" aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value as '' | StatusCurso)}>
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
          </select>
        </BarraFiltros>

        {lista.erro && (
          <div className="p-4">
            <MensagemErro mensagem={lista.erro} aoTentarNovamente={lista.recarregar} />
          </div>
        )}
        {lista.carregando && !dados && <Carregando />}
        {dados?.conteudo.length === 0 && <EstadoVazio icone={BookOpen} titulo={termo || status || modalidade ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'} />}
        {dados && dados.conteudo.length > 0 && (
          <div className={lista.carregando ? 'opacity-60' : ''}>
            <Tabela
              itens={dados.conteudo}
              chave={(c) => c.id}
              colunas={[
                {
                  titulo: 'Curso',
                  celula: (c) => (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{c.nome}</p>
                      <p className="font-mono text-xs text-slate-500">{c.codigo}</p>
                    </div>
                  ),
                },
                {
                  titulo: 'Modalidade',
                  celula: (c) => <Etiqueta cor={c.modalidade === 'EAD' ? 'roxo' : 'azul'}>{c.modalidade === 'EAD' ? 'EAD' : 'Presencial'}</Etiqueta>,
                },
                { titulo: 'Local das aulas', celula: (c) => c.localAulas, ocultarNoCelular: true },
                { titulo: 'Carga horária', celula: (c) => `${c.cargaHoraria} h`, ocultarNoCelular: true },
                { titulo: 'Turmas', celula: (c) => c.quantidadeTurmas ?? 0, ocultarNoCelular: true },
                { titulo: 'Status', celula: (c) => <Etiqueta cor={c.status === 'ATIVO' ? 'verde' : 'cinza'}>{c.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</Etiqueta> },
              ]}
              acoes={
                admin
                  ? (c) => (
                      <>
                        <BotaoIcone icone={School} rotulo="Turmas vinculadas" onClick={() => setVendoTurmas(c)} />
                        <BotaoIcone icone={Pencil} rotulo="Editar" onClick={() => setEditando(c)} />
                        <BotaoIcone icone={Power} rotulo={c.status === 'ATIVO' ? 'Inativar' : 'Ativar'} onClick={() => setAlternando(c)} />
                      </>
                    )
                  : undefined
              }
            />
            <Paginacao pagina={dados.pagina} totalPaginas={dados.totalPaginas} totalElementos={dados.totalElementos} aoMudar={setPagina} />
          </div>
        )}
      </div>

      {admin && (
        <FormularioCurso
          aberto={formAberto || !!editando}
          curso={editando}
          aoFechar={fecharForm}
          aoSalvar={() => {
            fecharForm()
            void lista.recarregar()
          }}
        />
      )}
      <TurmasDoCurso curso={vendoTurmas} aoFechar={() => setVendoTurmas(null)} />
      <Confirmacao
        aberto={!!alternando}
        titulo={alternando?.status === 'ATIVO' ? 'Inativar curso?' : 'Ativar curso?'}
        mensagem={
          alternando?.status === 'ATIVO'
            ? 'Cursos inativos não recebem novos alunos, turmas ou professores. Os vínculos existentes são mantidos.'
            : 'O curso voltará a aceitar novos vínculos.'
        }
        textoConfirmar={alternando?.status === 'ATIVO' ? 'Inativar' : 'Ativar'}
        perigoso={alternando?.status === 'ATIVO'}
        carregando={processando}
        aoConfirmar={confirmarAlternancia}
        aoCancelar={() => setAlternando(null)}
      />
    </>
  )
}
