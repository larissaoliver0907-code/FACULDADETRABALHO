import { BarChart3, Download, FileText, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Botao } from '../components/ui/Botao'
import { Campo, Selecao } from '../components/ui/Campos'
import { Carregando, EstadoVazio, MensagemErro } from '../components/ui/Feedback'
import { CabecalhoPagina, Cartao } from '../components/ui/Layout'
import { useToast } from '../contexts/ToastContext'
import { useCarregar } from '../hooks/useCarregar'
import { ApiError } from '../services/api'
import { cursoService, relatorioService, turmaService } from '../services/educonnect'
import type { FiltroRelatorio, Relatorio } from '../types'
import { formatarData, formatarDataHora } from '../utils/formatar'

const FILTROS_POR_TIPO: Record<string, { curso: boolean; turma: boolean; periodo: boolean }> = {
  alunos: { curso: true, turma: true, periodo: false },
  professores: { curso: true, turma: false, periodo: false },
  cursos: { curso: true, turma: false, periodo: false },
  turmas: { curso: true, turma: true, periodo: false },
  notas: { curso: true, turma: true, periodo: true },
  desempenho: { curso: true, turma: true, periodo: true },
}

function formatarCelula(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'number') return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return formatarData(valor)
  return valor
}

export default function Relatorios() {
  const toast = useToast()
  const tipos = useCarregar(() => relatorioService.tipos(), [])
  const cursos = useCarregar(() => cursoService.ativos(), [])
  const [tipo, setTipo] = useState('alunos')
  const [cursoId, setCursoId] = useState('')
  const [turmaId, setTurmaId] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [baixando, setBaixando] = useState<'csv' | 'pdf' | null>(null)

  const turmas = useCarregar(
    () => turmaService.listar({ cursoId: cursoId ? Number(cursoId) : undefined, size: 100, sort: 'codigo' }).then((p) => p.conteudo),
    [cursoId],
  )

  const suporte = FILTROS_POR_TIPO[tipo] ?? { curso: false, turma: false, periodo: false }

  const filtro = (): FiltroRelatorio => ({
    cursoId: suporte.curso && cursoId ? Number(cursoId) : undefined,
    turmaId: suporte.turma && turmaId ? Number(turmaId) : undefined,
    inicio: suporte.periodo && inicio ? inicio : undefined,
    fim: suporte.periodo && fim ? fim : undefined,
  })

  const gerar = async () => {
    if (inicio && fim && inicio > fim) {
      setErro('A data inicial deve ser anterior à data final.')
      return
    }
    setGerando(true)
    setErro(null)
    try {
      setRelatorio(await relatorioService.gerar(tipo, filtro()))
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível gerar o relatório.')
    } finally {
      setGerando(false)
    }
  }

  const baixar = async (formato: 'csv' | 'pdf') => {
    setBaixando(formato)
    try {
      await relatorioService.baixar(tipo, formato, filtro())
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível baixar o arquivo.')
    } finally {
      setBaixando(null)
    }
  }

  // Gera automaticamente ao trocar o tipo de relatório.
  useEffect(() => {
    setRelatorio(null)
    void gerar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo])

  return (
    <>
      <CabecalhoPagina titulo="Relatórios" descricao="Consulte, filtre e exporte os dados acadêmicos em CSV ou PDF." />

      {tipos.erro && <MensagemErro mensagem={tipos.erro} aoTentarNovamente={tipos.recarregar} />}

      <div className="mb-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {tipos.dados?.map((t) => (
          <button
            key={t.tipo}
            onClick={() => setTipo(t.tipo)}
            title={t.descricao}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tipo === t.tipo
                ? 'bg-marinho-900 text-white shadow-sm dark:bg-blue-600'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-marinho-900 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            {t.titulo}
          </button>
        ))}
      </div>

      <Cartao titulo="Filtros" descricao={tipos.dados?.find((t) => t.tipo === tipo)?.descricao} className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Selecao rotulo="Curso" value={cursoId} disabled={!suporte.curso} onChange={(e) => { setCursoId(e.target.value); setTurmaId('') }}>
            <option value="">Todos</option>
            {cursos.dados?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Selecao>
          <Selecao rotulo="Turma" value={turmaId} disabled={!suporte.turma} onChange={(e) => setTurmaId(e.target.value)}>
            <option value="">Todas</option>
            {turmas.dados?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo}
              </option>
            ))}
          </Selecao>
          <Campo rotulo="Data inicial" type="date" value={inicio} disabled={!suporte.periodo} onChange={(e) => setInicio(e.target.value)} />
          <Campo rotulo="Data final" type="date" value={fim} disabled={!suporte.periodo} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Botao icone={Play} onClick={gerar} carregando={gerando}>
            Gerar relatório
          </Botao>
          <Botao variante="secundario" icone={Download} onClick={() => baixar('csv')} carregando={baixando === 'csv'} disabled={baixando !== null}>
            Exportar CSV
          </Botao>
          <Botao variante="secundario" icone={FileText} onClick={() => baixar('pdf')} carregando={baixando === 'pdf'} disabled={baixando !== null}>
            Exportar PDF
          </Botao>
        </div>
      </Cartao>

      {erro && <MensagemErro mensagem={erro} />}
      {gerando && !relatorio && <Carregando texto="Gerando relatório…" />}
      {relatorio && (
        <Cartao titulo={relatorio.titulo} descricao={`Gerado em ${formatarDataHora(relatorio.geradoEm)}`} semPadding className={gerando ? 'opacity-60' : ''}>
          {Object.keys(relatorio.resumo ?? {}).length > 0 && (
            <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-100 sm:grid-cols-3 lg:grid-cols-5 dark:border-white/10 dark:bg-white/5">
              {Object.entries(relatorio.resumo).map(([k, v]) => (
                <div key={k} className="bg-white px-4 py-3 dark:bg-marinho-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatarCelula(v)}</p>
                </div>
              ))}
            </div>
          )}
          {relatorio.linhas.length === 0 ? (
            <EstadoVazio icone={BarChart3} titulo="Nenhum registro" descricao="Não há dados para os filtros selecionados." />
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white dark:bg-marinho-900">
                  <tr className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:border-white/10">
                    {relatorio.colunas.map((c) => (
                      <th key={c} className="px-4 py-3 whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {relatorio.linhas.map((linha, i) => (
                    <tr key={i}>
                      {relatorio.colunas.map((c) => (
                        <td key={c} className={`px-4 py-2.5 whitespace-nowrap ${typeof linha[c] === 'number' ? 'text-right tabular-nums' : ''}`}>
                          {formatarCelula(linha[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Cartao>
      )}
    </>
  )
}
