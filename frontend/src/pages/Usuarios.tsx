import { KeyRound, Power, ShieldCheck, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Botao, BotaoIcone } from '../components/ui/Botao'
import { Campo, CampoBusca } from '../components/ui/Campos'
import { Carregando, EstadoVazio, Etiqueta, EtiquetaAtivo, MensagemErro } from '../components/ui/Feedback'
import { BarraFiltros, CabecalhoPagina, Cartao } from '../components/ui/Layout'
import { Confirmacao, Modal } from '../components/ui/Modal'
import { Paginacao, Tabela } from '../components/ui/Tabela'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useCarregar, useDebounce } from '../hooks/useCarregar'
import { MSG_LOGIN, MSG_SENHA, REGEX_LOGIN, REGEX_SENHA, useFormulario } from '../hooks/useFormulario'
import { rotuloPerfil } from '../layouts/navegacao'
import { ApiError } from '../services/api'
import { usuarioService } from '../services/educonnect'
import type { Perfil, Usuario } from '../types'

const corPerfil: Record<Perfil, 'roxo' | 'azul' | 'cinza'> = { ADMINISTRADOR: 'roxo', PROFESSOR: 'azul', ALUNO: 'cinza' }

const permissoes: { perfil: Perfil; itens: string[] }[] = [
  {
    perfil: 'ADMINISTRADOR',
    itens: ['Gerencia alunos, professores, cursos e turmas', 'Lança, corrige e exclui avaliações', 'Gera e exporta relatórios', 'Gerencia contas e critérios acadêmicos'],
  },
  {
    perfil: 'PROFESSOR',
    itens: ['Consulta as turmas sob sua responsabilidade', 'Lança e edita avaliações das próprias turmas abertas', 'Consulta cursos e o dashboard'],
  },
  { perfil: 'ALUNO', itens: ['Consulta os próprios dados', 'Consulta notas, médias e situação acadêmica'] },
]

function NovoAdministrador({ aberto, aoFechar, aoSalvar }: { aberto: boolean; aoFechar: () => void; aoSalvar: () => void }) {
  const f = useFormulario({ nome: '', login: '', senha: '' })
  const { reiniciar } = f
  useEffect(() => {
    if (aberto) reiniciar({ nome: '', login: '', senha: '' })
  }, [aberto, reiniciar])

  const salvar = async () => {
    const ok = await f.enviar(
      () => usuarioService.criarAdministrador({ nome: f.valores.nome.trim(), login: f.valores.login.trim(), senha: f.valores.senha }),
      'Administrador cadastrado.',
      () => {
        const e: Record<string, string> = {}
        if (!f.valores.nome.trim()) e.nome = 'Informe o nome.'
        if (!REGEX_LOGIN.test(f.valores.login.trim())) e.login = MSG_LOGIN
        if (!REGEX_SENHA.test(f.valores.senha)) e.senha = MSG_SENHA
        return e
      },
    )
    if (ok) aoSalvar()
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Novo administrador"
      descricao="Alunos e professores são cadastrados nas respectivas páginas."
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao onClick={salvar} carregando={f.enviando}>
            Cadastrar
          </Botao>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Nome" obrigatorio value={f.valores.nome} erro={f.erros.nome} onChange={(e) => f.alterar('nome', e.target.value)} />
        <Campo rotulo="Login" obrigatorio autoComplete="off" value={f.valores.login} erro={f.erros.login} onChange={(e) => f.alterar('login', e.target.value)} />
        <Campo rotulo="Senha inicial" obrigatorio type="password" autoComplete="new-password" ajuda={MSG_SENHA} value={f.valores.senha} erro={f.erros.senha} onChange={(e) => f.alterar('senha', e.target.value)} />
      </div>
    </Modal>
  )
}

function RedefinirSenha({ usuario, aoFechar }: { usuario: Usuario | null; aoFechar: () => void }) {
  const f = useFormulario({ senha: '', confirmacao: '' })
  const { reiniciar } = f
  useEffect(() => {
    if (usuario) reiniciar({ senha: '', confirmacao: '' })
  }, [usuario, reiniciar])

  const salvar = async () => {
    if (!usuario) return
    const ok = await f.enviar(() => usuarioService.redefinirSenha(usuario.id, f.valores.senha), 'Senha redefinida.', () => {
      const e: Record<string, string> = {}
      if (!REGEX_SENHA.test(f.valores.senha)) e.senha = MSG_SENHA
      if (f.valores.senha !== f.valores.confirmacao) e.confirmacao = 'As senhas não coincidem.'
      return e
    })
    if (ok) aoFechar()
  }

  return (
    <Modal
      aberto={!!usuario}
      titulo="Redefinir senha"
      descricao={usuario ? `${usuario.nome} (${usuario.login})` : undefined}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao onClick={salvar} carregando={f.enviando}>
            Redefinir
          </Botao>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Nova senha" type="password" autoComplete="new-password" ajuda={MSG_SENHA} value={f.valores.senha} erro={f.erros.senha ?? f.erros.novaSenha} onChange={(e) => f.alterar('senha', e.target.value)} />
        <Campo rotulo="Confirme a nova senha" type="password" autoComplete="new-password" value={f.valores.confirmacao} erro={f.erros.confirmacao} onChange={(e) => f.alterar('confirmacao', e.target.value)} />
      </div>
    </Modal>
  )
}

export default function Usuarios() {
  const { usuario: atual } = useAuth()
  const toast = useToast()
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca)
  const [pagina, setPagina] = useState(0)
  const [novoAberto, setNovoAberto] = useState(false)
  const [redefinindo, setRedefinindo] = useState<Usuario | null>(null)
  const [alternando, setAlternando] = useState<Usuario | null>(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => setPagina(0), [termo])
  const lista = useCarregar(() => usuarioService.listar({ q: termo || undefined, page: pagina, size: 10, sort: 'nome' }), [termo, pagina])

  const confirmar = async () => {
    if (!alternando) return
    setProcessando(true)
    try {
      await usuarioService.alterarAtivo(alternando.id, !alternando.ativo)
      toast.sucesso(alternando.ativo ? 'Conta desativada.' : 'Conta ativada.')
      setAlternando(null)
      void lista.recarregar()
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível alterar a conta.')
    } finally {
      setProcessando(false)
    }
  }

  const dados = lista.dados

  return (
    <>
      <CabecalhoPagina
        titulo="Usuários e permissões"
        descricao="Contas de acesso de todos os perfis."
        acoes={
          <Botao icone={UserPlus} onClick={() => setNovoAberto(true)}>
            Novo administrador
          </Botao>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <BarraFiltros>
            <CampoBusca className="sm:max-w-xs" placeholder="Nome ou login" aria-label="Buscar usuário" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </BarraFiltros>
          {lista.erro && (
            <div className="p-4">
              <MensagemErro mensagem={lista.erro} aoTentarNovamente={lista.recarregar} />
            </div>
          )}
          {lista.carregando && !dados && <Carregando />}
          {dados?.conteudo.length === 0 && <EstadoVazio icone={ShieldCheck} titulo="Nenhum usuário encontrado" />}
          {dados && dados.conteudo.length > 0 && (
            <>
              <Tabela
                itens={dados.conteudo}
                chave={(u) => u.id}
                colunas={[
                  {
                    titulo: 'Usuário',
                    celula: (u) => (
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {u.nome} {u.id === atual?.id && <span className="text-xs font-normal text-slate-400">(você)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{u.login}</p>
                      </div>
                    ),
                  },
                  { titulo: 'Perfil', celula: (u) => <Etiqueta cor={corPerfil[u.perfil]}>{rotuloPerfil[u.perfil]}</Etiqueta> },
                  { titulo: 'Identificação', celula: (u) => <span className="font-mono text-xs">{u.identificacao}</span>, ocultarNoCelular: true },
                  { titulo: 'Situação', celula: (u) => <EtiquetaAtivo ativo={u.ativo} />, ocultarNoCelular: true },
                ]}
                acoes={(u) => (
                  <>
                    <BotaoIcone icone={KeyRound} rotulo="Redefinir senha" onClick={() => setRedefinindo(u)} />
                    <BotaoIcone icone={Power} rotulo={u.ativo ? 'Desativar conta' : 'Ativar conta'} disabled={u.id === atual?.id} onClick={() => setAlternando(u)} />
                  </>
                )}
              />
              <Paginacao pagina={dados.pagina} totalPaginas={dados.totalPaginas} totalElementos={dados.totalElementos} aoMudar={setPagina} />
            </>
          )}
        </div>

        <Cartao titulo="Permissões por perfil" descricao="Aplicadas no servidor a cada requisição.">
          <div className="space-y-5">
            {permissoes.map((p) => (
              <div key={p.perfil}>
                <Etiqueta cor={corPerfil[p.perfil]}>{rotuloPerfil[p.perfil]}</Etiqueta>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {p.itens.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-slate-400" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Cartao>
      </div>

      <NovoAdministrador
        aberto={novoAberto}
        aoFechar={() => setNovoAberto(false)}
        aoSalvar={() => {
          setNovoAberto(false)
          void lista.recarregar()
        }}
      />
      <RedefinirSenha usuario={redefinindo} aoFechar={() => setRedefinindo(null)} />
      <Confirmacao
        aberto={!!alternando}
        titulo={alternando?.ativo ? 'Desativar conta?' : 'Ativar conta?'}
        mensagem={
          alternando?.ativo
            ? `${alternando.nome} perderá o acesso imediatamente. Os dados e o histórico serão preservados.`
            : `${alternando?.nome} voltará a ter acesso ao sistema.`
        }
        textoConfirmar={alternando?.ativo ? 'Desativar' : 'Ativar'}
        perigoso={!!alternando?.ativo}
        carregando={processando}
        aoConfirmar={confirmar}
        aoCancelar={() => setAlternando(null)}
      />
    </>
  )
}
