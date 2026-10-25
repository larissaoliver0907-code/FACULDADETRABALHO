import { Etiqueta, EstadoVazio } from './ui/Feedback'
import { Tabela } from './ui/Tabela'
import type { Avaliacao, Desempenho } from '../types'
import { corSituacao, formatarData, formatarNota } from '../utils/formatar'

/** Tabela de médias e situação por turma (reutilizada pelo administrador e pela área do aluno). */
export function TabelaDesempenho({ desempenho }: { desempenho: Desempenho }) {
  if (desempenho.turmas.length === 0) {
    return <EstadoVazio titulo="Sem turmas ou avaliações" descricao="Quando houver avaliações lançadas, as médias aparecem aqui." />
  }
  return (
    <>
      <Tabela
        itens={desempenho.turmas}
        chave={(t) => t.turma.id}
        colunas={[
          {
            titulo: 'Turma',
            celula: (t) => (
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{t.turma.codigo}</p>
                <p className="text-xs text-slate-500">{t.turma.cursoNome}</p>
              </div>
            ),
          },
          { titulo: 'Avaliações', celula: (t) => t.quantidadeAvaliacoes, ocultarNoCelular: true },
          { titulo: 'Média', celula: (t) => <span className="font-semibold tabular-nums">{formatarNota(t.media)}</span> },
          { titulo: 'Situação', celula: (t) => <Etiqueta cor={corSituacao[t.situacao]}>{t.situacaoDescricao}</Etiqueta> },
        ]}
      />
      {!desempenho.criterioConfigurado && (
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-white/10">
          A situação acadêmica será calculada quando a instituição configurar a média mínima de aprovação.
        </p>
      )}
    </>
  )
}

export function TabelaHistorico({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  if (avaliacoes.length === 0) return <EstadoVazio titulo="Nenhuma avaliação registrada" />
  return (
    <Tabela
      itens={avaliacoes}
      chave={(a) => a.id}
      colunas={[
        { titulo: 'Data', celula: (a) => <span className="whitespace-nowrap">{formatarData(a.data)}</span> },
        {
          titulo: 'Avaliação',
          celula: (a) => (
            <div>
              <p className="text-slate-900 dark:text-white">{a.descricao}</p>
              <p className="text-xs text-slate-500 md:hidden">{a.turma.codigo}</p>
            </div>
          ),
        },
        { titulo: 'Turma', celula: (a) => a.turma.codigo, ocultarNoCelular: true },
        {
          titulo: 'Nota',
          className: 'text-right',
          celula: (a) => <span className="font-semibold tabular-nums">{formatarNota(a.nota)}</span>,
        },
      ]}
    />
  )
}
