import { KeyRound, Moon, Save, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { Botao } from '../components/ui/Botao'
import { Campo } from '../components/ui/Campos'
import { Carregando, MensagemErro } from '../components/ui/Feedback'
import { CabecalhoPagina, Cartao } from '../components/ui/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCarregar } from '../hooks/useCarregar'
import { MSG_SENHA, REGEX_SENHA, useFormulario } from '../hooks/useFormulario'
import { authService, configuracaoService } from '../services/educonnect'
import { formatarDataHora } from '../utils/formatar'

function CriteriosAcademicos({ editavel }: { editavel: boolean }) {
  const config = useCarregar(() => configuracaoService.obter(), [])
  const f = useFormulario({ aprovacao: '', recuperacao: '', quantidade: '1' })
  const { reiniciar } = f

  useEffect(() => {
    if (!config.dados) return
    reiniciar({
      aprovacao: config.dados.mediaMinimaAprovacao?.toString() ?? '',
      recuperacao: config.dados.mediaMinimaRecuperacao?.toString() ?? '',
      quantidade: String(config.dados.quantidadeMinimaAvaliacoes),
    })
  }, [config.dados, reiniciar])

  const numero = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

  const validar = () => {
    const e: Record<string, string> = {}
    const ap = numero(f.valores.aprovacao)
    const rec = numero(f.valores.recuperacao)
    const qtd = Number(f.valores.quantidade)
    if (ap !== null && (Number.isNaN(ap) || ap < 0 || ap > 10)) e.mediaMinimaAprovacao = 'Informe um valor de 0 a 10.'
    if (rec !== null && (Number.isNaN(rec) || rec < 0 || rec > 10)) e.mediaMinimaRecuperacao = 'Informe um valor de 0 a 10.'
    if (rec !== null && ap === null) e.mediaMinimaRecuperacao = 'Defina primeiro a média de aprovação.'
    if (rec !== null && ap !== null && rec >= ap) e.mediaMinimaRecuperacao = 'Deve ser menor que a média de aprovação.'
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 50) e.quantidadeMinimaAvaliacoes = 'Informe um número de 1 a 50.'
    return e
  }

  const salvar = async () => {
    const ok = await f.enviar(
      () =>
        configuracaoService.atualizar({
          mediaMinimaAprovacao: numero(f.valores.aprovacao),
          mediaMinimaRecuperacao: numero(f.valores.recuperacao),
          quantidadeMinimaAvaliacoes: Number(f.valores.quantidade),
        }),
      'Critérios acadêmicos salvos.',
      validar,
    )
    if (ok) void config.recarregar()
  }

  return (
    <Cartao
      titulo="Critérios acadêmicos"
      descricao="Definidos pela instituição. O sistema não presume médias oficiais: sem média de aprovação, a situação não é calculada."
    >
      {config.erro && <MensagemErro mensagem={config.erro} aoTentarNovamente={config.recarregar} />}
      {!config.dados && !config.erro && <Carregando />}
      {config.dados && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void salvar()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo rotulo="Média mínima de aprovação" inputMode="decimal" placeholder="Não definida" disabled={!editavel} value={f.valores.aprovacao} erro={f.erros.mediaMinimaAprovacao} onChange={(e) => f.alterar('aprovacao', e.target.value)} />
            <Campo
              rotulo="Média mínima de recuperação"
              inputMode="decimal"
              placeholder="Opcional"
              ajuda="Entre esta média e a de aprovação, o aluno fica em recuperação."
              disabled={!editavel}
              value={f.valores.recuperacao}
              erro={f.erros.mediaMinimaRecuperacao}
              onChange={(e) => f.alterar('recuperacao', e.target.value)}
            />
            <Campo rotulo="Mínimo de avaliações" type="number" min={1} max={50} disabled={!editavel} value={f.valores.quantidade} erro={f.erros.quantidadeMinimaAvaliacoes} onChange={(e) => f.alterar('quantidade', e.target.value)} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Última alteração: {formatarDataHora(config.dados.atualizadoEm)}</p>
            {editavel && (
              <Botao type="submit" icone={Save} carregando={f.enviando}>
                Salvar critérios
              </Botao>
            )}
          </div>
        </form>
      )}
    </Cartao>
  )
}

function AlterarSenha() {
  const f = useFormulario({ atual: '', nova: '', confirmacao: '' })

  const salvar = async () => {
    const ok = await f.enviar(() => authService.alterarSenha(f.valores.atual, f.valores.nova), 'Senha alterada.', () => {
      const e: Record<string, string> = {}
      if (!f.valores.atual) e.senhaAtual = 'Informe a senha atual.'
      if (!REGEX_SENHA.test(f.valores.nova)) e.novaSenha = MSG_SENHA
      if (f.valores.nova !== f.valores.confirmacao) e.confirmacao = 'As senhas não coincidem.'
      return e
    })
    if (ok) f.reiniciar({ atual: '', nova: '', confirmacao: '' })
  }

  return (
    <Cartao titulo="Alterar minha senha">
      <form
        className="grid gap-4 sm:grid-cols-3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
      >
        <Campo rotulo="Senha atual" type="password" autoComplete="current-password" value={f.valores.atual} erro={f.erros.senhaAtual} onChange={(e) => f.alterar('atual', e.target.value)} />
        <Campo rotulo="Nova senha" type="password" autoComplete="new-password" value={f.valores.nova} erro={f.erros.novaSenha} ajuda={MSG_SENHA} onChange={(e) => f.alterar('nova', e.target.value)} />
        <Campo rotulo="Confirme a nova senha" type="password" autoComplete="new-password" value={f.valores.confirmacao} erro={f.erros.confirmacao} onChange={(e) => f.alterar('confirmacao', e.target.value)} />
        <div className="sm:col-span-3">
          <Botao type="submit" icone={KeyRound} carregando={f.enviando}>
            Alterar senha
          </Botao>
        </div>
      </form>
    </Cartao>
  )
}

export default function Configuracoes() {
  const { usuario } = useAuth()
  const { tema, alternar } = useTheme()
  const admin = usuario?.perfil === 'ADMINISTRADOR'

  return (
    <>
      <CabecalhoPagina titulo="Configurações" descricao={admin ? 'Critérios acadêmicos, aparência e segurança da conta.' : 'Aparência e segurança da sua conta.'} />
      <div className="space-y-6">
        {usuario?.perfil !== 'ALUNO' && <CriteriosAcademicos editavel={admin} />}
        <Cartao titulo="Aparência">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Tema {tema === 'escuro' ? 'escuro' : 'claro'} ativo neste navegador.</p>
            <Botao variante="secundario" icone={tema === 'escuro' ? Sun : Moon} onClick={alternar}>
              Usar tema {tema === 'escuro' ? 'claro' : 'escuro'}
            </Botao>
          </div>
        </Cartao>
        <AlterarSenha />
      </div>
    </>
  )
}
