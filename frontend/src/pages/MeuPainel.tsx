import { BookOpen, ClipboardList, School, Star } from 'lucide-react'
import { TabelaDesempenho, TabelaHistorico } from '../components/Desempenho'
import { Carregando, MensagemErro } from '../components/ui/Feedback'
import { CabecalhoPagina, Cartao, Indicador } from '../components/ui/Layout'
import { useCarregar } from '../hooks/useCarregar'
import { meuPerfilService } from '../services/educonnect'
import { formatarNota } from '../utils/formatar'

/** Área do aluno: somente os próprios dados, notas e situação acadêmica. */
export default function MeuPainel({ somenteNotas = false }: { somenteNotas?: boolean }) {
  const dados = useCarregar(() => meuPerfilService.dados(), [])
  const desempenho = useCarregar(() => meuPerfilService.desempenho(), [])
  const historico = useCarregar(() => meuPerfilService.avaliacoes(), [])

  if (dados.erro) return <MensagemErro mensagem={dados.erro} aoTentarNovamente={dados.recarregar} />
  if (!dados.dados) return <Carregando />
  const a = dados.dados

  return (
    <>
      <CabecalhoPagina
        titulo={somenteNotas ? 'Minhas notas' : `Olá, ${a.nome.split(' ')[0]}`}
        descricao={`Matrícula ${a.matricula} · ${a.curso.nome}`}
      />

      {!somenteNotas && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Indicador rotulo="Curso" valor={a.curso.codigo} icone={BookOpen} destaque="marinho" detalhe={a.curso.modalidade === 'EAD' ? 'EAD' : 'Presencial'} />
          <Indicador rotulo="Turmas" valor={a.turmas?.length ?? 0} icone={School} destaque="ciano" />
          <Indicador rotulo="Avaliações" valor={desempenho.dados?.totalAvaliacoes ?? '—'} icone={ClipboardList} destaque="violeta" />
          <Indicador rotulo="Média geral" valor={formatarNota(desempenho.dados?.mediaGeral)} icone={Star} destaque="ambar" />
        </div>
      )}

      <div className="space-y-6">
        <Cartao titulo="Situação por turma" semPadding>
          {desempenho.erro && <div className="p-4"><MensagemErro mensagem={desempenho.erro} /></div>}
          {desempenho.dados ? <TabelaDesempenho desempenho={desempenho.dados} /> : !desempenho.erro && <Carregando />}
        </Cartao>
        <Cartao titulo="Histórico de avaliações" semPadding>
          {historico.erro && <div className="p-4"><MensagemErro mensagem={historico.erro} /></div>}
          {historico.dados ? <TabelaHistorico avaliacoes={historico.dados} /> : !historico.erro && <Carregando />}
        </Cartao>
      </div>
    </>
  )
}
