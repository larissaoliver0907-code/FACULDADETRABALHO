import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Botao, BotaoIcone } from '../components/ui/Botao'
import { Campo, Selecao } from '../components/ui/Campos'
import { Carregando, EstadoVazio, MensagemErro } from '../components/ui/Feedback'
import { BarraFiltros, CabecalhoPagina } from '../components/ui/Layout'
import { Confirmacao, Modal } from '../components/ui/Modal'
import { Paginacao, Tabela } from '../components/ui/Tabela'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useCarregar } from '../hooks/useCarregar'
import { useFormulario } from '../hooks/useFormulario'
import { ApiError } from '../services/api'
import { avaliacaoService, turmaService } from '../services/educonnect'
import type { Avaliacao } from '../types'
import { formatarData, formatarNota, hojeISO } from '../utils/formatar'

interface FormAvaliacao {
  turmaId: string
  alunoId: string
  descricao: string
  nota: string
  data: string
}

/**
 * Lançamento e edição de avaliações. A nota é validada no navegador (0 a 10, até duas casas)
 * e novamente no servidor, que é a fonte de verdade.
 */
export function FormularioAvaliacao({
  aberto,
  avaliacao,
  turmaFixa,
  alunoFixo,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean
  avaliacao: Avaliacao | null
  turmaFixa?: number
  alunoFixo?: number
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const f = useFormulario<FormAvaliacao>({ turmaId: '', alunoId: '', descricao: '', nota: '', data: hojeISO() })
  const { reiniciar } = f
  const v = f.valores

  useEffect(() => {
    if (!aberto) return
    reiniciar(
      avaliacao
        ? {
            turmaId: String(avaliacao.turma.id),
            alunoId: String(avaliacao.aluno.id),
            descricao: avaliacao.descricao,
            nota: String(avaliacao.nota),
            data: avaliacao.data,
          }
        : {
            turmaId: turmaFixa ? String(turmaFixa) : '',
            alunoId: alunoFixo ? String(alunoFixo) : '',
            descricao: '',
            nota: '',
            data: hojeISO(),
          },
    )
  }, [aberto, avaliacao, turmaFixa, alunoFixo, reiniciar])

  const turmas = useCarregar(
    () => (aberto && !avaliacao ? turmaService.listar({ status: 'ABERTA', size: 100, sort: 'codigo' }).then((p) => p.conteudo) : Promise.resolve([])),
    [aberto, avaliacao],
  )
  const turmaSelecionada = useCarregar(
    () => (aberto && !avaliacao && v.turmaId ? turmaService.buscar(Number(v.turmaId)) : Promise.resolve(null)),
    [aberto, avaliacao, v.turmaId],
  )

  const validar = () => {
    const e: Record<string, string> = {}
    if (!avaliacao && !v.turmaId) e.turmaId = 'Selecione a turma.'
    if (!avaliacao && !v.alunoId) e.alunoId = 'Selecione o aluno.'
    if (!v.descricao.trim()) e.descricao = 'Informe a descrição.'
    const textoNota = v.nota.replace(',', '.').trim()
    const nota = Number(textoNota)
    if (textoNota === '' || Number.isNaN(nota)) e.nota = 'Informe a nota.'
    else if (nota < 0 || nota > 10) e.nota = 'A nota deve estar entre 0 e 10.'
    else if (!/^\d{1,2}(\.\d{1,2})?$/.test(textoNota)) e.nota = 'Use no máximo duas casas decimais.'
    if (!v.data) e.data = 'Informe a data.'
    else if (v.data > hojeISO()) e.data = 'A data não pode estar no futuro.'
    return e
  }

  const salvar = async () => {
    const nota = Number(v.nota.replace(',', '.'))
    const ok = await f.enviar(
      () =>
        avaliacao
          ? avaliacaoService.atualizar(avaliacao.id, { descricao: v.descricao.trim(), nota, data: v.data })
          : avaliacaoService.criar({
              turmaId: Number(v.turmaId),
              alunoId: Number(v.alunoId),
              descricao: v.descricao.trim(),
              nota,
              data: v.data,
            }),
      avaliacao ? 'Avaliação atualizada.' : 'Avaliação lançada.',
      validar,
    )
    if (ok) aoSalvar()
  }

  const alunosAtivos = turmaSelecionada.dados?.alunos ?? []

  return (
    <Modal
      aberto={aberto}
      titulo={avaliacao ? 'Editar avaliação' : 'Lançar avaliação'}
      descricao={avaliacao ? `${avaliacao.aluno.nome} · ${avaliacao.turma.codigo}` : 'Notas de 0 a 10, com até duas casas decimais.'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar} disabled={f.enviando}>
            Cancelar
          </Botao>
          <Botao onClick={salvar} carregando={f.enviando}>
            {avaliacao ? 'Salvar alterações' : 'Lançar nota'}
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
        {!avaliacao && (
          <>
            <Selecao
              className="sm:col-span-2"
              rotulo="Turma"
              obrigatorio
              value={v.turmaId}
              erro={f.erros.turmaId}
              disabled={!!turmaFixa}
              onChange={(e) => {
                f.alterar('turmaId', e.target.value)
                f.alterar('alunoId', '')
              }}
            >
              <option value="">Selecione…</option>
              {turmas.dados?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} — {t.curso.nome}
                </option>
              ))}
            </Selecao>
            <Selecao
              className="sm:col-span-2"
              rotulo="Aluno"
              obrigatorio
              value={v.alunoId}
              erro={f.erros.alunoId}
              disabled={!v.turmaId || !!alunoFixo}
              ajuda={v.turmaId && turmaSelecionada.dados && alunosAtivos.length === 0 ? 'Esta turma não possui alunos matriculados.' : undefined}
              onChange={(e) => f.alterar('alunoId', e.target.value)}
            >
              <option value="">Selecione…</option>
              {alunosAtivos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.matricula})
                </option>
              ))}
            </Selecao>
          </>
        )}
        <Campo className="sm:col-span-2" rotulo="Descrição" obrigatorio placeholder="Ex.: Prova 1, Trabalho final" value={v.descricao} erro={f.erros.descricao} onChange={(e) => f.alterar('descricao', e.target.value)} maxLength={200} />
        <Campo rotulo="Nota" obrigatorio inputMode="decimal" placeholder="0 a 10" value={v.nota} erro={f.erros.nota} onChange={(e) => f.alterar('nota', e.target.value)} />
        <Campo rotulo="Data" obrigatorio type="date" max={hojeISO()} value={v.data} erro={f.erros.data} onChange={(e) => f.alterar('data', e.target.value)} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}

export default function Avaliacoes() {
  const { temPerfil } = useAuth()
  const admin = temPerfil('ADMINISTRADOR')
  const toast = useToast()
  const [turmaId, setTurmaId] = useState('')
  const [pagina, setPagina] = useState(0)
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<Avaliacao | null>(null)
  const [excluindo, setExcluindo] = useState<Avaliacao | null>(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => setPagina(0), [turmaId])

  const turmas = useCarregar(() => turmaService.listar({ size: 100, sort: 'codigo' }).then((p) => p.conteudo), [])
  const lista = useCarregar(
    () => avaliacaoService.listar({ turmaId: turmaId ? Number(turmaId) : undefined, page: pagina, size: 15, sort: 'data,desc' }),
    [turmaId, pagina],
  )

  const excluir = async () => {
    if (!excluindo) return
    setProcessando(true)
    try {
      await avaliacaoService.excluir(excluindo.id)
      toast.sucesso('Avaliação excluída.')
      setExcluindo(null)
      void lista.recarregar()
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível excluir.')
    } finally {
      setProcessando(false)
    }
  }

  const dados = lista.dados

  return (
    <>
      <CabecalhoPagina
        titulo="Avaliações"
        descricao={admin ? 'Notas lançadas em todas as turmas.' : 'Notas das suas turmas.'}
        acoes={
          <Botao icone={Plus} onClick={() => setFormAberto(true)}>
            Lançar avaliação
          </Botao>
        }
      />

      <div className="card overflow-hidden">
        <BarraFiltros>
          <select className="campo sm:max-w-72" aria-label="Filtrar por turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            <option value="">Todas as turmas</option>
            {turmas.dados?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo} — {t.curso.nome}
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
        {dados?.conteudo.length === 0 && <EstadoVazio icone={ClipboardList} titulo="Nenhuma avaliação lançada" />}
        {dados && dados.conteudo.length > 0 && (
          <div className={lista.carregando ? 'opacity-60' : ''}>
            <Tabela
              itens={dados.conteudo}
              chave={(a) => a.id}
              colunas={[
                { titulo: 'Data', celula: (a) => <span className="whitespace-nowrap">{formatarData(a.data)}</span>, ocultarNoCelular: true },
                {
                  titulo: 'Aluno',
                  celula: (a) => (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{a.aluno.nome}</p>
                      <p className="text-xs text-slate-500">
                        {a.descricao} · <span className="md:hidden">{a.turma.codigo}</span>
                        <span className="hidden md:inline">{a.aluno.matricula}</span>
                      </p>
                    </div>
                  ),
                },
                { titulo: 'Turma', celula: (a) => a.turma.codigo, ocultarNoCelular: true },
                {
                  titulo: 'Nota',
                  className: 'text-right',
                  celula: (a) => (
                    <span className={`font-semibold tabular-nums ${a.nota < 5 ? 'text-red-600 dark:text-red-400' : ''}`}>{formatarNota(a.nota)}</span>
                  ),
                },
              ]}
              acoes={(a) => (
                <>
                  <BotaoIcone icone={Pencil} rotulo="Editar" onClick={() => setEditando(a)} />
                  {admin && <BotaoIcone icone={Trash2} rotulo="Excluir" className="hover:!text-red-600" onClick={() => setExcluindo(a)} />}
                </>
              )}
            />
            <Paginacao pagina={dados.pagina} totalPaginas={dados.totalPaginas} totalElementos={dados.totalElementos} aoMudar={setPagina} />
          </div>
        )}
      </div>

      <FormularioAvaliacao
        aberto={formAberto || !!editando}
        avaliacao={editando}
        turmaFixa={turmaId ? Number(turmaId) : undefined}
        aoFechar={() => {
          setFormAberto(false)
          setEditando(null)
        }}
        aoSalvar={() => {
          setFormAberto(false)
          setEditando(null)
          void lista.recarregar()
        }}
      />
      <Confirmacao
        aberto={!!excluindo}
        titulo="Excluir avaliação?"
        mensagem={
          <>
            A avaliação <strong>{excluindo?.descricao}</strong> de <strong>{excluindo?.aluno.nome}</strong> será removida
            permanentemente e a média do aluno será recalculada.
          </>
        }
        textoConfirmar="Excluir"
        carregando={processando}
        aoConfirmar={excluir}
        aoCancelar={() => setExcluindo(null)}
      />
    </>
  )
}
