import { ArrowLeft, Pencil, Power, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TabelaDesempenho, TabelaHistorico } from '../components/Desempenho'
import { Botao } from '../components/ui/Botao'
import { Carregando, EtiquetaAtivo, MensagemErro } from '../components/ui/Feedback'
import { CabecalhoPagina, Cartao } from '../components/ui/Layout'
import { Confirmacao } from '../components/ui/Modal'
import { useToast } from '../contexts/ToastContext'
import { useCarregar } from '../hooks/useCarregar'
import { ApiError } from '../services/api'
import { alunoService, cursoService } from '../services/educonnect'
import { formatarData, formatarNota } from '../utils/formatar'
import { FormularioAluno } from './Alunos'

export default function AlunoDetalhe() {
  const id = Number(useParams().id)
  const toast = useToast()
  const [editando, setEditando] = useState(false)
  const [alternando, setAlternando] = useState(false)
  const [processando, setProcessando] = useState(false)

  const aluno = useCarregar(() => alunoService.buscar(id), [id])
  const desempenho = useCarregar(() => alunoService.desempenho(id), [id])
  const historico = useCarregar(() => alunoService.avaliacoes(id), [id])
  const cursos = useCarregar(() => cursoService.ativos(), [])

  if (aluno.erro) return <MensagemErro mensagem={aluno.erro} aoTentarNovamente={aluno.recarregar} />
  if (!aluno.dados) return <Carregando />
  const a = aluno.dados

  const alternar = async () => {
    setProcessando(true)
    try {
      await alunoService.alterarAtivo(a.id, !a.ativo)
      toast.sucesso(a.ativo ? 'Aluno desativado. O histórico foi preservado.' : 'Aluno reativado.')
      setAlternando(false)
      void aluno.recarregar()
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível alterar o cadastro.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <>
      <Link to="/alunos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white">
        <ArrowLeft className="size-4" /> Alunos
      </Link>
      <CabecalhoPagina
        titulo={a.nome}
        descricao={`Matrícula ${a.matricula} · ${a.curso.nome}`}
        acoes={
          <>
            <Botao variante="secundario" icone={Power} onClick={() => setAlternando(true)}>
              {a.ativo ? 'Desativar' : 'Reativar'}
            </Botao>
            <Botao icone={Pencil} onClick={() => setEditando(true)}>
              Editar
            </Botao>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Cartao titulo="Dados do aluno">
          <dl className="space-y-3 text-sm">
            {[
              ['Situação', <EtiquetaAtivo key="s" ativo={a.ativo} />],
              ['Matrícula', a.matricula],
              ['Curso', `${a.curso.codigo} — ${a.curso.nome}`],
              ['Modalidade', a.curso.modalidade === 'EAD' ? 'EAD' : 'Presencial'],
              ['Login', a.login],
              ['Cadastrado em', formatarData(a.criadoEm)],
            ].map(([rotulo, valor]) => (
              <div key={String(rotulo)} className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">{rotulo}</dt>
                <dd className="text-right font-medium text-slate-800 dark:text-slate-100">{valor}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Turmas atuais</p>
            {a.turmas && a.turmas.length > 0 ? (
              <ul className="space-y-1.5">
                {a.turmas.map((t) => (
                  <li key={t.id}>
                    <Link to={`/turmas/${t.id}`} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                      {t.codigo}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Não está matriculado em turmas.</p>
            )}
          </div>
        </Cartao>

        <div className="space-y-6 lg:col-span-2">
          <Cartao
            titulo="Desempenho por turma"
            semPadding
            acoes={
              desempenho.dados && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <Star className="size-3.5" /> Média geral {formatarNota(desempenho.dados.mediaGeral)}
                </span>
              )
            }
          >
            {desempenho.erro && <div className="p-4"><MensagemErro mensagem={desempenho.erro} /></div>}
            {desempenho.dados ? <TabelaDesempenho desempenho={desempenho.dados} /> : !desempenho.erro && <Carregando />}
          </Cartao>
          <Cartao titulo="Histórico de avaliações" semPadding>
            {historico.erro && <div className="p-4"><MensagemErro mensagem={historico.erro} /></div>}
            {historico.dados ? <TabelaHistorico avaliacoes={historico.dados} /> : !historico.erro && <Carregando />}
          </Cartao>
        </div>
      </div>

      <FormularioAluno
        aberto={editando}
        aluno={a}
        cursos={cursos.dados ?? []}
        aoFechar={() => setEditando(false)}
        aoSalvar={() => {
          setEditando(false)
          void aluno.recarregar()
        }}
      />
      <Confirmacao
        aberto={alternando}
        titulo={a.ativo ? 'Desativar aluno?' : 'Reativar aluno?'}
        mensagem={
          a.ativo
            ? 'O aluno perderá o acesso e não poderá ser matriculado em novas turmas. Notas e histórico serão preservados.'
            : 'O aluno voltará a ter acesso ao sistema.'
        }
        textoConfirmar={a.ativo ? 'Desativar' : 'Reativar'}
        perigoso={a.ativo}
        carregando={processando}
        aoConfirmar={alternar}
        aoCancelar={() => setAlternando(false)}
      />
    </>
  )
}
