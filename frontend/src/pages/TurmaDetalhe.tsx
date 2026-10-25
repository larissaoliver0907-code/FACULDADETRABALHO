import { ArrowLeft, ClipboardPlus, Pencil, UserMinus, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Botao, BotaoIcone } from '../components/ui/Botao'
import { CampoBusca } from '../components/ui/Campos'
import { Carregando, EstadoVazio, Etiqueta, MensagemErro } from '../components/ui/Feedback'
import { CabecalhoPagina, Cartao } from '../components/ui/Layout'
import { Confirmacao, Modal } from '../components/ui/Modal'
import { Tabela } from '../components/ui/Tabela'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useCarregar, useDebounce } from '../hooks/useCarregar'
import { ApiError } from '../services/api'
import { alunoService, avaliacaoService, cursoService, turmaService } from '../services/educonnect'
import type { AlunoResumo, Turma } from '../types'
import { corStatusTurma, formatarData, formatarNota, rotuloStatusTurma } from '../utils/formatar'
import { FormularioAvaliacao } from './Avaliacoes'
import { FormularioTurma } from './Turmas'

function MatricularAluno({ turma, aberto, aoFechar, aoMatricular }: { turma: Turma; aberto: boolean; aoFechar: () => void; aoMatricular: (t: Turma) => void }) {
  const toast = useToast()
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca)
  const [enviando, setEnviando] = useState<number | null>(null)
  const candidatos = useCarregar(
    () =>
      aberto
        ? alunoService.listar({ cursoId: turma.curso.id, ativo: true, q: termo || undefined, size: 20, sort: 'nome' }).then((p) => p.conteudo)
        : Promise.resolve([]),
    [aberto, turma.curso.id, termo],
  )
  const matriculados = new Set(turma.alunos?.map((a) => a.id))
  const disponiveis = candidatos.dados?.filter((a) => !matriculados.has(a.id)) ?? []

  const matricular = async (alunoId: number) => {
    setEnviando(alunoId)
    try {
      const atualizada = await turmaService.matricular(turma.id, alunoId)
      toast.sucesso('Aluno matriculado.')
      aoMatricular(atualizada)
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível matricular.')
    } finally {
      setEnviando(null)
    }
  }

  return (
    <Modal aberto={aberto} titulo="Matricular aluno" descricao={`Alunos ativos do curso ${turma.curso.nome}. Vagas: ${turma.vagasDisponiveis}.`} aoFechar={aoFechar}>
      <CampoBusca placeholder="Buscar por nome ou matrícula" aria-label="Buscar aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="mt-4">
        {candidatos.carregando && <Carregando />}
        {candidatos.erro && <MensagemErro mensagem={candidatos.erro} />}
        {!candidatos.carregando && disponiveis.length === 0 && <EstadoVazio titulo="Nenhum aluno disponível" descricao="Todos os alunos ativos deste curso já estão na turma ou nenhum corresponde à busca." />}
        <ul className="divide-y divide-slate-100 dark:divide-white/10">
          {disponiveis.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.nome}</p>
                <p className="font-mono text-xs text-slate-500">{a.matricula}</p>
              </div>
              <Botao tamanho="sm" icone={UserPlus} carregando={enviando === a.id} disabled={turma.vagasDisponiveis === 0 || enviando !== null} onClick={() => matricular(a.id)}>
                Matricular
              </Botao>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}

export default function TurmaDetalhe() {
  const id = Number(useParams().id)
  const { temPerfil } = useAuth()
  const admin = temPerfil('ADMINISTRADOR')
  const toast = useToast()
  const [matriculando, setMatriculando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [removendo, setRemovendo] = useState<AlunoResumo | null>(null)
  const [processando, setProcessando] = useState(false)
  const [lancandoPara, setLancandoPara] = useState<number | null | undefined>(undefined)

  const turma = useCarregar(() => turmaService.buscar(id), [id])
  const avaliacoes = useCarregar(() => avaliacaoService.listar({ turmaId: id, size: 100, sort: 'data,desc' }), [id])
  const cursos = useCarregar(() => (admin ? cursoService.ativos() : Promise.resolve([])), [admin])

  if (turma.erro) return <MensagemErro mensagem={turma.erro} aoTentarNovamente={turma.recarregar} />
  if (!turma.dados) return <Carregando />
  const t = turma.dados

  // Média por aluno a partir das avaliações da turma.
  const notasPorAluno = new Map<number, number[]>()
  avaliacoes.dados?.conteudo.forEach((a) => notasPorAluno.set(a.aluno.id, [...(notasPorAluno.get(a.aluno.id) ?? []), Number(a.nota)]))
  const media = (alunoId: number) => {
    const n = notasPorAluno.get(alunoId)
    return n && n.length ? n.reduce((s, x) => s + x, 0) / n.length : null
  }

  const remover = async () => {
    if (!removendo) return
    setProcessando(true)
    try {
      const atualizada = await turmaService.desmatricular(t.id, removendo.id)
      turma.setDados(atualizada)
      toast.sucesso('Aluno removido da turma. As avaliações foram preservadas no histórico.')
      setRemovendo(null)
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível remover.')
    } finally {
      setProcessando(false)
    }
  }

  const ocupacao = Math.round((t.matriculados / t.capacidadeMaxima) * 100)

  return (
    <>
      <Link to="/turmas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white">
        <ArrowLeft className="size-4" /> Turmas
      </Link>
      <CabecalhoPagina
        titulo={`Turma ${t.codigo}`}
        descricao={`${t.curso.nome} · ${t.curso.modalidade === 'EAD' ? 'EAD' : 'Presencial'}`}
        acoes={
          <>
            {admin && (
              <Botao variante="secundario" icone={Pencil} onClick={() => setEditando(true)}>
                Editar
              </Botao>
            )}
            {t.status === 'ABERTA' && (
              <Botao variante="secundario" icone={ClipboardPlus} onClick={() => setLancandoPara(null)} disabled={t.matriculados === 0}>
                Lançar avaliação
              </Botao>
            )}
            {admin && t.status === 'ABERTA' && (
              <Botao icone={UserPlus} onClick={() => setMatriculando(true)} disabled={t.vagasDisponiveis === 0}>
                {t.vagasDisponiveis === 0 ? 'Turma lotada' : 'Matricular aluno'}
              </Botao>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Status', <Etiqueta key="s" cor={corStatusTurma[t.status]}>{rotuloStatusTurma[t.status]}</Etiqueta>],
          ['Professor', t.professor?.nome ?? 'Não definido'],
          ['Matriculados', `${t.matriculados} de ${t.capacidadeMaxima} (${ocupacao}%)`],
          ['Vagas disponíveis', t.vagasDisponiveis],
        ].map(([rotulo, valor]) => (
          <div key={String(rotulo)} className="card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{rotulo}</p>
            <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{valor}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Cartao titulo="Alunos matriculados" semPadding>
          {!t.alunos || t.alunos.length === 0 ? (
            <EstadoVazio icone={Users} titulo="Nenhum aluno matriculado" />
          ) : (
            <Tabela
              itens={t.alunos}
              chave={(a) => a.id}
              colunas={[
                {
                  titulo: 'Aluno',
                  celula: (a) => (
                    <div>
                      {admin ? (
                        <Link to={`/alunos/${a.id}`} className="font-medium text-slate-900 hover:text-blue-600 dark:text-white">
                          {a.nome}
                        </Link>
                      ) : (
                        <p className="font-medium text-slate-900 dark:text-white">{a.nome}</p>
                      )}
                      <p className="font-mono text-xs text-slate-500">{a.matricula}</p>
                    </div>
                  ),
                },
                { titulo: 'Média na turma', celula: (a) => <span className="tabular-nums">{formatarNota(media(a.id))}</span> },
              ]}
              acoes={(a) => (
                <>
                  {t.status === 'ABERTA' && <BotaoIcone icone={ClipboardPlus} rotulo="Lançar avaliação" onClick={() => setLancandoPara(a.id)} />}
                  {admin && <BotaoIcone icone={UserMinus} rotulo="Remover da turma" className="hover:!text-red-600" onClick={() => setRemovendo(a)} />}
                </>
              )}
            />
          )}
        </Cartao>

        <Cartao titulo="Avaliações da turma" semPadding>
          {avaliacoes.erro && <div className="p-4"><MensagemErro mensagem={avaliacoes.erro} /></div>}
          {avaliacoes.carregando && !avaliacoes.dados && <Carregando />}
          {avaliacoes.dados?.conteudo.length === 0 && <EstadoVazio titulo="Nenhuma avaliação lançada" />}
          {avaliacoes.dados && avaliacoes.dados.conteudo.length > 0 && (
            <Tabela
              itens={avaliacoes.dados.conteudo}
              chave={(a) => a.id}
              colunas={[
                { titulo: 'Data', celula: (a) => formatarData(a.data), ocultarNoCelular: true },
                {
                  titulo: 'Aluno',
                  celula: (a) => (
                    <div>
                      <p className="text-slate-900 dark:text-white">{a.aluno.nome}</p>
                      <p className="text-xs text-slate-500">{a.descricao}</p>
                    </div>
                  ),
                },
                { titulo: 'Nota', className: 'text-right', celula: (a) => <span className="font-semibold tabular-nums">{formatarNota(a.nota)}</span> },
              ]}
            />
          )}
        </Cartao>
      </div>

      {admin && <MatricularAluno turma={t} aberto={matriculando} aoFechar={() => setMatriculando(false)} aoMatricular={(nova) => turma.setDados(nova)} />}
      {admin && (
        <FormularioTurma
          aberto={editando}
          turma={t}
          cursos={cursos.dados ?? []}
          aoFechar={() => setEditando(false)}
          aoSalvar={(nova) => {
            setEditando(false)
            turma.setDados(nova)
          }}
        />
      )}
      <FormularioAvaliacao
        aberto={lancandoPara !== undefined}
        avaliacao={null}
        turmaFixa={t.id}
        alunoFixo={lancandoPara ?? undefined}
        aoFechar={() => setLancandoPara(undefined)}
        aoSalvar={() => {
          setLancandoPara(undefined)
          void avaliacoes.recarregar()
        }}
      />
      <Confirmacao
        aberto={!!removendo}
        titulo="Remover aluno da turma?"
        mensagem={
          <>
            <strong>{removendo?.nome}</strong> deixará de fazer parte da turma {t.codigo}. As avaliações já lançadas continuam no
            histórico do aluno.
          </>
        }
        textoConfirmar="Remover"
        carregando={processando}
        aoConfirmar={remover}
        aoCancelar={() => setRemovendo(null)}
      />
    </>
  )
}
