/**
 * API SIMULADA — usada somente no build de demonstração (VITE_DEMO=true).
 * Reproduz no navegador os contratos e as principais regras do backend para que a
 * interface possa ser explorada sem servidor. Todos os dados são exemplos e ficam só na memória.
 */
import type { ErroApi, Perfil } from '../../types'

type Params = Record<string, string | number | boolean | undefined | null>

interface CursoE { id: number; codigo: string; nome: string; cargaHoraria: number; descricao?: string; status: 'ATIVO' | 'INATIVO'; modalidade: 'PRESENCIAL' | 'EAD'; sala?: string; plataforma?: string; criadoEm: string }
interface UsuarioE { id: number; nome: string; login: string; senha: string; perfil: Perfil; ativo: boolean; criadoEm: string; matricula?: string; cursoId?: number; registro?: string; especialidade?: string; cursoIds?: number[] }
interface TurmaE { id: number; codigo: string; cursoId: number; professorId: number | null; capacidadeMaxima: number; status: 'ABERTA' | 'ENCERRADA' | 'CANCELADA'; alunoIds: number[] }
interface AvalE { id: number; alunoId: number; turmaId: number; descricao: string; nota: number; data: string; atualizadoEm: string }

import { SENHA_DEMO } from './contas'

const agora = () => new Date().toISOString()
const diasAtras = (d: number) => {
  const x = new Date(Date.now() - d * 86400000)
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const hoje = () => diasAtras(0)

let seq = 100
const novoId = () => ++seq

const cursos: CursoE[] = [
  { id: 1, codigo: 'ADS', nome: 'Análise e Desenvolvimento de Sistemas', cargaHoraria: 2400, descricao: 'Tecnólogo em desenvolvimento de software.', status: 'ATIVO', modalidade: 'PRESENCIAL', sala: 'B-204', criadoEm: agora() },
  { id: 2, codigo: 'GTI', nome: 'Gestão da Tecnologia da Informação', cargaHoraria: 1600, status: 'ATIVO', modalidade: 'EAD', plataforma: 'Moodle', criadoEm: agora() },
  { id: 3, codigo: 'ENG-CIVIL', nome: 'Engenharia Civil', cargaHoraria: 3600, status: 'ATIVO', modalidade: 'PRESENCIAL', sala: 'C-110', criadoEm: agora() },
]

const usuarios: UsuarioE[] = [
  { id: 1, nome: 'Administrador da Secretaria', login: 'admin', senha: SENHA_DEMO, perfil: 'ADMINISTRADOR', ativo: true, criadoEm: agora() },
  { id: 10, nome: 'Ana Lima', login: 'ana.lima', senha: SENHA_DEMO, perfil: 'PROFESSOR', ativo: true, criadoEm: agora(), registro: 'P-1001', especialidade: 'Engenharia de Software', cursoIds: [1] },
  { id: 11, nome: 'Bruno Reis', login: 'bruno.reis', senha: SENHA_DEMO, perfil: 'PROFESSOR', ativo: true, criadoEm: agora(), registro: 'P-1002', especialidade: 'Redes e Infraestrutura', cursoIds: [1, 2] },
  { id: 12, nome: 'Marina Duarte', login: 'marina.duarte', senha: SENHA_DEMO, perfil: 'PROFESSOR', ativo: true, criadoEm: agora(), registro: 'P-1003', especialidade: 'Estruturas', cursoIds: [3] },
]
const nomesAlunos: [string, number][] = [
  ['Carla Souza', 1], ['Diego Martins', 1], ['Elisa Ramos', 1], ['Felipe Costa', 1], ['Gabriela Nunes', 1],
  ['Henrique Alves', 2], ['Isabela Rocha', 2], ['João Pedro Silva', 2], ['Larissa Melo', 3], ['Mateus Farias', 3],
]
nomesAlunos.forEach(([nome, cursoId], i) => {
  const login = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ').filter((_, j, a) => j === 0 || j === a.length - 1).join('.')
  usuarios.push({ id: 20 + i, nome, login, senha: SENHA_DEMO, perfil: 'ALUNO', ativo: i !== 4, criadoEm: agora(), matricula: `2026${String(i + 1).padStart(4, '0')}`, cursoId })
})

const turmas: TurmaE[] = [
  { id: 1, codigo: 'ADS-2026A', cursoId: 1, professorId: 10, capacidadeMaxima: 5, status: 'ABERTA', alunoIds: [20, 21, 22, 23] },
  { id: 2, codigo: 'GTI-2026A', cursoId: 2, professorId: 11, capacidadeMaxima: 40, status: 'ABERTA', alunoIds: [25, 26, 27] },
  { id: 3, codigo: 'ENG-2026A', cursoId: 3, professorId: 12, capacidadeMaxima: 30, status: 'ABERTA', alunoIds: [28, 29] },
  { id: 4, codigo: 'ADS-2025B', cursoId: 1, professorId: 11, capacidadeMaxima: 30, status: 'ENCERRADA', alunoIds: [20, 21] },
]

const avaliacoes: AvalE[] = []
const lancar = (alunoId: number, turmaId: number, descricao: string, nota: number, dias: number) =>
  avaliacoes.push({ id: novoId(), alunoId, turmaId, descricao, nota, data: diasAtras(dias), atualizadoEm: agora() })
;([[20, 8.5, 9], [21, 6, 5.5], [22, 4, 6.5], [23, 9.5, 10]] as const).forEach(([a, n1, n2]) => {
  lancar(a, 1, 'Prova 1', n1, 30)
  lancar(a, 1, 'Trabalho prático', n2, 12)
})
;([[25, 7], [26, 3.5], [27, 8]] as const).forEach(([a, n]) => lancar(a, 2, 'Atividade avaliativa 1', n, 20))
lancar(28, 3, 'Prova 1', 7.5, 15)
lancar(29, 3, 'Prova 1', 5, 15)
lancar(20, 4, 'Prova final', 8, 200)
lancar(21, 4, 'Prova final', 7, 200)

const config = { mediaMinimaAprovacao: 6 as number | null, mediaMinimaRecuperacao: 4 as number | null, quantidadeMinimaAvaliacoes: 1, atualizadoEm: agora() }

const atividades: { tipo: string; descricao: string; usuario: string; criadoEm: string }[] = [
  { tipo: 'AVALIACAO', descricao: 'Avaliação "Trabalho prático" lançada na turma ADS-2026A', usuario: 'ana.lima', criadoEm: new Date(Date.now() - 3600_000).toISOString() },
  { tipo: 'MATRICULA', descricao: 'Aluno 20260007 matriculado na turma GTI-2026A', usuario: 'admin', criadoEm: new Date(Date.now() - 86400_000).toISOString() },
  { tipo: 'CURSO', descricao: 'Curso cadastrado: ENG-CIVIL — Engenharia Civil', usuario: 'admin', criadoEm: new Date(Date.now() - 3 * 86400_000).toISOString() },
]

let usuarioAtual: UsuarioE | null = null

// ------------------------------------------------------------------ utilitários

function erro(status: number, mensagem: string, campos?: Record<string, string>): never {
  throw { status, mensagem, campos } satisfies ErroApi
}
const registrar = (tipo: string, descricao: string) =>
  atividades.unshift({ tipo, descricao, usuario: usuarioAtual?.login ?? 'sistema', criadoEm: agora() })

const curso = (id: number) => cursos.find((c) => c.id === id) ?? erro(404, `Curso não encontrado(a): ${id}`)
const turma = (id: number) => turmas.find((t) => t.id === id) ?? erro(404, `Turma não encontrado(a): ${id}`)
const usuario = (id: number) => usuarios.find((u) => u.id === id) ?? erro(404, `Usuário não encontrado(a): ${id}`)
const aluno = (id: number) => {
  const u = usuarios.find((x) => x.id === id && x.perfil === 'ALUNO')
  return u ?? erro(404, `Aluno não encontrado(a): ${id}`)
}
const professor = (id: number) => {
  const u = usuarios.find((x) => x.id === id && x.perfil === 'PROFESSOR')
  return u ?? erro(404, `Professor não encontrado(a): ${id}`)
}
const contem = (texto: string | undefined, q: unknown) => !q || (texto ?? '').toLowerCase().includes(String(q).toLowerCase())

function paginar<T>(itens: T[], p: Params, campoPadrao: string) {
  const [campo, dir] = String(p.sort ?? campoPadrao).split(',')
  const ordenados = [...itens].sort((a, b) => {
    const va = (a as Record<string, unknown>)[campo]
    const vb = (b as Record<string, unknown>)[campo]
    const r = String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR', { numeric: true })
    return dir === 'desc' ? -r : r
  })
  const tamanho = Number(p.size ?? 10)
  const pagina = Number(p.page ?? 0)
  return {
    conteudo: ordenados.slice(pagina * tamanho, pagina * tamanho + tamanho),
    pagina,
    tamanho,
    totalElementos: itens.length,
    totalPaginas: Math.ceil(itens.length / tamanho),
  }
}

const media = (notas: number[]) => (notas.length ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 100) / 100 : null)

function situacao(notas: number[]) {
  if (!notas.length) return ['SEM_AVALIACOES', 'Sem avaliações'] as const
  if (config.mediaMinimaAprovacao === null) return ['CRITERIO_NAO_CONFIGURADO', 'Critério não configurado'] as const
  if (notas.length < config.quantidadeMinimaAvaliacoes) return ['AVALIACOES_INSUFICIENTES', 'Avaliações insuficientes'] as const
  const m = media(notas)!
  if (m >= config.mediaMinimaAprovacao) return ['APROVADO', 'Aprovado'] as const
  if (config.mediaMinimaRecuperacao !== null && m >= config.mediaMinimaRecuperacao) return ['RECUPERACAO', 'Recuperação'] as const
  return ['REPROVADO', 'Reprovado'] as const
}

// ------------------------------------------------------------------ conversões para DTO

const cursoResumo = (c: CursoE) => ({ id: c.id, codigo: c.codigo, nome: c.nome, modalidade: c.modalidade })
const cursoDto = (c: CursoE) => ({
  ...c,
  localAulas: c.modalidade === 'EAD' ? `Plataforma ${c.plataforma}` : `Sala ${c.sala}`,
  quantidadeTurmas: turmas.filter((t) => t.cursoId === c.id).length,
})
const alunoResumo = (u: UsuarioE) => ({ id: u.id, nome: u.nome, matricula: u.matricula!, ativo: u.ativo })
const turmaResumo = (t: TurmaE) => ({ id: t.id, codigo: t.codigo, cursoNome: curso(t.cursoId).nome })
const alunoDto = (u: UsuarioE, detalhar = false) => ({
  id: u.id, nome: u.nome, matricula: u.matricula, login: u.login, ativo: u.ativo, criadoEm: u.criadoEm,
  curso: cursoResumo(curso(u.cursoId!)),
  turmas: detalhar ? turmas.filter((t) => t.alunoIds.includes(u.id)).map(turmaResumo) : undefined,
})
const professorDto = (u: UsuarioE) => ({
  id: u.id, nome: u.nome, registro: u.registro, especialidade: u.especialidade, login: u.login, ativo: u.ativo, criadoEm: u.criadoEm,
  cursos: (u.cursoIds ?? []).map((id) => cursoResumo(curso(id))),
  quantidadeTurmas: turmas.filter((t) => t.professorId === u.id).length,
})
const turmaDto = (t: TurmaE, incluirAlunos = false) => {
  const c = curso(t.cursoId)
  const p = t.professorId ? usuario(t.professorId) : null
  return {
    id: t.id, codigo: t.codigo, curso: cursoResumo(c),
    professor: p ? { id: p.id, nome: p.nome, registro: p.registro } : undefined,
    capacidadeMaxima: t.capacidadeMaxima, matriculados: t.alunoIds.length,
    vagasDisponiveis: Math.max(0, t.capacidadeMaxima - t.alunoIds.length), status: t.status,
    resumo: `Turma ${t.codigo} — ${c.nome} — ${p?.nome ?? 'sem professor'} — ${t.alunoIds.length}/${t.capacidadeMaxima} alunos`,
    alunos: incluirAlunos ? t.alunoIds.map((id) => alunoResumo(usuario(id))).sort((a, b) => a.nome.localeCompare(b.nome)) : undefined,
  }
}
const avaliacaoDto = (a: AvalE) => ({
  id: a.id, aluno: alunoResumo(usuario(a.alunoId)), turma: turmaResumo(turma(a.turmaId)),
  descricao: a.descricao, nota: a.nota, data: a.data, atualizadoEm: a.atualizadoEm,
})

function desempenho(u: UsuarioE) {
  const minhas = avaliacoes.filter((a) => a.alunoId === u.id)
  const ids = [...new Set([...minhas.map((a) => a.turmaId), ...turmas.filter((t) => t.alunoIds.includes(u.id)).map((t) => t.id)])]
  return {
    aluno: alunoResumo(u),
    mediaGeral: media(minhas.map((a) => a.nota)),
    totalAvaliacoes: minhas.length,
    criterioConfigurado: config.mediaMinimaAprovacao !== null,
    turmas: ids.map((id) => {
      const notas = minhas.filter((a) => a.turmaId === id).map((a) => a.nota)
      const [s, d] = situacao(notas)
      return { turma: turmaResumo(turma(id)), quantidadeAvaliacoes: notas.length, media: media(notas), situacao: s, situacaoDescricao: d }
    }),
  }
}

// ------------------------------------------------------------------ autorização

function exigir(...perfis: Perfil[]) {
  if (!usuarioAtual) erro(401, 'Autenticação necessária. Faça login novamente.')
  if (perfis.length && !perfis.includes(usuarioAtual.perfil)) erro(403, 'Você não tem permissão para acessar este recurso.')
  return usuarioAtual
}
function acessoTurma(t: TurmaE) {
  const u = exigir('ADMINISTRADOR', 'PROFESSOR')
  if (u.perfil === 'PROFESSOR' && t.professorId !== u.id) erro(403, `Você não tem acesso à turma ${t.codigo}.`)
}

// ------------------------------------------------------------------ validações

const RE_SENHA = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/
const RE_LOGIN = /^[A-Za-z0-9._-]{3,60}$/
const RE_CODIGO = /^[A-Za-z0-9][A-Za-z0-9-]{1,19}$/
function validar(regras: [boolean, string, string][]) {
  const campos: Record<string, string> = {}
  regras.forEach(([falhou, campo, msg]) => falhou && !campos[campo] && (campos[campo] = msg))
  if (Object.keys(campos).length) erro(400, 'Dados inválidos. Verifique os campos destacados.', campos)
}
const loginEmUso = (login: string, exceto?: number) => usuarios.some((u) => u.login === login.toLowerCase() && u.id !== exceto)

// ------------------------------------------------------------------ relatórios

function relatorio(tipo: string, p: Params) {
  const cursoId = p.cursoId ? Number(p.cursoId) : undefined
  const turmaId = p.turmaId ? Number(p.turmaId) : undefined
  const inicio = p.inicio as string | undefined
  const fim = p.fim as string | undefined
  const filtraAval = (a: AvalE) =>
    (!turmaId || a.turmaId === turmaId) && (!cursoId || turma(a.turmaId).cursoId === cursoId) && (!inicio || a.data >= inicio) && (!fim || a.data <= fim)
  let titulo = ''
  let colunas: string[] = []
  let linhas: Record<string, string | number | null>[] = []
  const resumo: Record<string, string | number | null> = {}
  switch (tipo) {
    case 'alunos': {
      titulo = 'Alunos cadastrados'
      colunas = ['Matrícula', 'Nome', 'Curso', 'Turmas', 'Situação']
      const lista = usuarios.filter((u) => u.perfil === 'ALUNO' && (!cursoId || u.cursoId === cursoId) && (!turmaId || turma(turmaId).alunoIds.includes(u.id)))
      linhas = lista.map((u) => ({ Matrícula: u.matricula!, Nome: u.nome, Curso: curso(u.cursoId!).nome, Turmas: turmas.filter((t) => t.alunoIds.includes(u.id)).length, Situação: u.ativo ? 'Ativo' : 'Inativo' }))
      resumo['Total de registros'] = lista.length
      resumo['Ativos'] = lista.filter((u) => u.ativo).length
      resumo['Inativos'] = lista.filter((u) => !u.ativo).length
      break
    }
    case 'professores': {
      titulo = 'Professores'
      colunas = ['Registro', 'Nome', 'Especialidade', 'Cursos', 'Turmas', 'Situação']
      const lista = usuarios.filter((u) => u.perfil === 'PROFESSOR' && (!cursoId || u.cursoIds?.includes(cursoId)))
      linhas = lista.map((u) => ({ Registro: u.registro!, Nome: u.nome, Especialidade: u.especialidade!, Cursos: u.cursoIds?.length ?? 0, Turmas: turmas.filter((t) => t.professorId === u.id).length, Situação: u.ativo ? 'Ativo' : 'Inativo' }))
      resumo['Total de registros'] = lista.length
      break
    }
    case 'cursos': {
      titulo = 'Cursos'
      colunas = ['Código', 'Nome', 'Modalidade', 'Carga horária (h)', 'Status', 'Local das aulas']
      const lista = cursos.filter((c) => !cursoId || c.id === cursoId)
      linhas = lista.map((c) => ({ Código: c.codigo, Nome: c.nome, Modalidade: c.modalidade === 'EAD' ? 'EAD' : 'Presencial', 'Carga horária (h)': c.cargaHoraria, Status: c.status === 'ATIVO' ? 'Ativo' : 'Inativo', 'Local das aulas': cursoDto(c).localAulas }))
      resumo['Total de registros'] = lista.length
      resumo['EAD'] = lista.filter((c) => c.modalidade === 'EAD').length
      resumo['Presenciais'] = lista.length - (resumo['EAD'] as number)
      break
    }
    case 'turmas': {
      titulo = 'Turmas e matrículas'
      colunas = ['Código', 'Curso', 'Professor', 'Matriculados', 'Capacidade', 'Ocupação (%)', 'Status']
      const lista = turmas.filter((t) => (!cursoId || t.cursoId === cursoId) && (!turmaId || t.id === turmaId))
      linhas = lista.map((t) => ({ Código: t.codigo, Curso: curso(t.cursoId).nome, Professor: t.professorId ? usuario(t.professorId).nome : '—', Matriculados: t.alunoIds.length, Capacidade: t.capacidadeMaxima, 'Ocupação (%)': Math.round((t.alunoIds.length * 100) / t.capacidadeMaxima), Status: t.status }))
      const mat = lista.reduce((s, t) => s + t.alunoIds.length, 0)
      const vagas = lista.reduce((s, t) => s + t.capacidadeMaxima, 0)
      Object.assign(resumo, { 'Total de registros': lista.length, Matrículas: mat, 'Vagas totais': vagas, 'Ocupação geral (%)': vagas ? Math.round((mat * 100) / vagas) : 0 })
      break
    }
    case 'notas': {
      titulo = 'Notas e médias'
      colunas = ['Data', 'Matrícula', 'Aluno', 'Turma', 'Avaliação', 'Nota']
      const lista = avaliacoes.filter(filtraAval).sort((a, b) => b.data.localeCompare(a.data))
      linhas = lista.map((a) => { const u = usuario(a.alunoId); return { Data: a.data, Matrícula: u.matricula!, Aluno: u.nome, Turma: turma(a.turmaId).codigo, Avaliação: a.descricao, Nota: a.nota } })
      const notas = lista.map((a) => a.nota)
      Object.assign(resumo, { 'Total de registros': lista.length, Média: media(notas), 'Maior nota': notas.length ? Math.max(...notas) : null, 'Menor nota': notas.length ? Math.min(...notas) : null })
      break
    }
    case 'desempenho': {
      titulo = 'Desempenho acadêmico'
      colunas = ['Matrícula', 'Aluno', 'Turma', 'Avaliações', 'Média', 'Situação']
      const grupos = new Map<string, AvalE[]>()
      avaliacoes.filter(filtraAval).forEach((a) => grupos.set(`${a.turmaId}:${a.alunoId}`, [...(grupos.get(`${a.turmaId}:${a.alunoId}`) ?? []), a]))
      linhas = [...grupos.values()].map((g) => {
        const u = usuario(g[0].alunoId)
        const notas = g.map((a) => a.nota)
        const [, d] = situacao(notas)
        resumo[d] = ((resumo[d] as number) ?? 0) + 1
        return { Matrícula: u.matricula!, Aluno: u.nome, Turma: turma(g[0].turmaId).codigo, Avaliações: notas.length, Média: media(notas), Situação: d }
      })
      resumo['Alunos avaliados (por turma)'] = linhas.length
      resumo['Média de aprovação configurada'] = config.mediaMinimaAprovacao ?? 'Não configurada'
      break
    }
    default:
      erro(404, `Relatório não encontrado(a): ${tipo}`)
  }
  return { tipo, titulo, colunas, linhas, resumo, geradoEm: agora() }
}

// ------------------------------------------------------------------ roteador

type Corpo = Record<string, unknown>

export async function mockRequisicao(metodo: string, caminho: string, corpo: Corpo | undefined, p: Params = {}): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 180)) // simula a latência da rede
  const seg = caminho.split('/').filter(Boolean)
  const id = seg[1] ? Number(seg[1]) : NaN
  const rota = `${metodo} /${seg.map((s) => (/^\d+$/.test(s) ? ':id' : s)).join('/')}`
  const b = corpo ?? {}

  switch (rota) {
    // ---------- autenticação
    case 'POST /auth/login': {
      const u = usuarios.find((x) => x.login === String(b.login ?? '').trim().toLowerCase())
      if (!u || u.senha !== b.senha || !u.ativo) erro(401, 'Login ou senha inválidos.')
      usuarioAtual = u
      return { token: `demo-${u.id}`, expiraEm: new Date(Date.now() + 7200_000).toISOString(), usuario: { id: u.id, nome: u.nome, login: u.login, perfil: u.perfil, identificacao: u.matricula ?? u.registro ?? u.login } }
    }
    case 'GET /auth/me': {
      const u = exigir()
      return { id: u.id, nome: u.nome, login: u.login, perfil: u.perfil, identificacao: u.matricula ?? u.registro ?? u.login }
    }
    case 'POST /auth/senha': {
      const u = exigir()
      if (b.senhaAtual !== u.senha) erro(422, 'A senha atual não confere.')
      validar([[!RE_SENHA.test(String(b.novaSenha)), 'novaSenha', 'A senha deve ter de 8 a 72 caracteres, com pelo menos uma letra e um número.']])
      u.senha = String(b.novaSenha)
      return undefined
    }

    // ---------- dashboard
    case 'GET /dashboard': {
      exigir('ADMINISTRADOR', 'PROFESSOR')
      const alunosAtivos = usuarios.filter((u) => u.perfil === 'ALUNO' && u.ativo)
      const porCurso = cursos.map((c) => ({ rotulo: c.nome, valor: alunosAtivos.filter((a) => a.cursoId === c.id).length })).filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor)
      const faixas = [0, 0, 0, 0, 0]
      avaliacoes.forEach((a) => faixas[Math.min(Math.floor(a.nota / 2), 4)]++)
      const grupos = new Map<string, number[]>()
      avaliacoes.forEach((a) => grupos.set(`${a.alunoId}:${a.turmaId}`, [...(grupos.get(`${a.alunoId}:${a.turmaId}`) ?? []), a.nota]))
      const sit = new Map<string, number>()
      grupos.forEach((n) => { const [, d] = situacao(n); sit.set(d, (sit.get(d) ?? 0) + 1) })
      return {
        totalAlunos: alunosAtivos.length,
        totalProfessores: usuarios.filter((u) => u.perfil === 'PROFESSOR' && u.ativo).length,
        totalCursos: cursos.length,
        totalTurmas: turmas.length,
        mediaGeral: media(avaliacoes.map((a) => a.nota)),
        matriculasAtivas: turmas.filter((t) => t.status === 'ABERTA').reduce((s, t) => s + t.alunoIds.length, 0),
        criterioConfigurado: config.mediaMinimaAprovacao !== null,
        alunosPorCurso: porCurso,
        distribuicaoNotas: ['0 a 2', '2 a 4', '4 a 6', '6 a 8', '8 a 10'].map((rotulo, i) => ({ rotulo, valor: faixas[i] })),
        situacaoAcademica: [...sit].map(([rotulo, valor]) => ({ rotulo, valor })),
        atividadesRecentes: atividades.slice(0, 10),
      }
    }

    // ---------- alunos
    case 'GET /alunos': {
      exigir('ADMINISTRADOR')
      const lista = usuarios.filter((u) => u.perfil === 'ALUNO'
        && (contem(u.nome, p.q) || contem(u.matricula, p.q))
        && (!p.cursoId || u.cursoId === Number(p.cursoId))
        && (!p.turmaId || turma(Number(p.turmaId)).alunoIds.includes(u.id))
        && (p.ativo === undefined || String(u.ativo) === String(p.ativo)))
      const pag = paginar(lista, p, 'nome')
      return { ...pag, conteudo: pag.conteudo.map((u) => alunoDto(u)) }
    }
    case 'GET /alunos/:id': exigir('ADMINISTRADOR'); return alunoDto(aluno(id), true)
    case 'POST /alunos':
    case 'PUT /alunos/:id': {
      exigir('ADMINISTRADOR')
      const existente = rota.startsWith('PUT') ? aluno(id) : undefined
      const matricula = String(b.matricula ?? '').trim().toUpperCase()
      const login = String(b.login ?? '').trim().toLowerCase()
      validar([
        [!String(b.nome ?? '').trim(), 'nome', 'Informe o nome.'],
        [!/^[A-Z0-9]{4,20}$/.test(matricula), 'matricula', 'A matrícula deve ter de 4 a 20 letras ou números.'],
        [!b.cursoId, 'cursoId', 'Selecione o curso.'],
        [!RE_LOGIN.test(login), 'login', 'Login inválido.'],
        [!!b.senha && !RE_SENHA.test(String(b.senha)), 'senha', 'A senha deve ter de 8 a 72 caracteres, com pelo menos uma letra e um número.'],
      ])
      if (!existente && !b.senha) erro(422, 'Informe a senha inicial do aluno.')
      if (usuarios.some((u) => u.matricula === matricula && u.id !== existente?.id)) erro(409, `Já existe um aluno com a matrícula ${matricula}.`)
      if (loginEmUso(login, existente?.id)) erro(409, `O login ${login} já está em uso.`)
      const c = curso(Number(b.cursoId))
      if (c.status !== 'ATIVO' && c.id !== existente?.cursoId) erro(422, 'Não é possível vincular o aluno a um curso inativo.')
      if (existente && existente.cursoId !== c.id && turmas.some((t) => t.status === 'ABERTA' && t.alunoIds.includes(existente.id)))
        erro(422, 'O aluno está matriculado em turmas abertas do curso atual. Remova-o das turmas antes de trocar o curso.')
      const alvo = existente ?? ({ id: novoId(), perfil: 'ALUNO', ativo: true, criadoEm: agora() } as UsuarioE)
      Object.assign(alvo, { nome: String(b.nome).trim(), matricula, login, cursoId: c.id, ...(b.senha ? { senha: String(b.senha) } : {}) })
      if (!existente) usuarios.push(alvo)
      registrar('ALUNO', `Aluno ${existente ? 'atualizado' : 'cadastrado'}: ${matricula} — ${alvo.nome}`)
      return alunoDto(alvo, true)
    }
    case 'PATCH /alunos/:id/ativo': {
      exigir('ADMINISTRADOR')
      const u = aluno(id)
      u.ativo = String(p.valor) === 'true'
      registrar('ALUNO', `Aluno ${u.matricula} ${u.ativo ? 'reativado' : 'desativado'}`)
      return alunoDto(u, true)
    }
    case 'GET /alunos/:id/avaliacoes': exigir('ADMINISTRADOR'); aluno(id); return avaliacoes.filter((a) => a.alunoId === id).sort((a, b) => b.data.localeCompare(a.data)).map(avaliacaoDto)
    case 'GET /alunos/:id/desempenho': exigir('ADMINISTRADOR'); return desempenho(aluno(id))

    // ---------- área do aluno
    case 'GET /me': return alunoDto(exigir('ALUNO'), true)
    case 'GET /me/avaliacoes': { const u = exigir('ALUNO'); return avaliacoes.filter((a) => a.alunoId === u.id).sort((a, b) => b.data.localeCompare(a.data)).map(avaliacaoDto) }
    case 'GET /me/desempenho': return desempenho(exigir('ALUNO'))

    // ---------- professores
    case 'GET /professores': {
      exigir('ADMINISTRADOR')
      const lista = usuarios.filter((u) => u.perfil === 'PROFESSOR'
        && (contem(u.nome, p.q) || contem(u.registro, p.q) || contem(u.especialidade, p.q))
        && (!p.cursoId || u.cursoIds?.includes(Number(p.cursoId)))
        && (p.ativo === undefined || String(u.ativo) === String(p.ativo)))
      const pag = paginar(lista, p, 'nome')
      return { ...pag, conteudo: pag.conteudo.map(professorDto) }
    }
    case 'GET /professores/:id': exigir('ADMINISTRADOR'); return professorDto(professor(id))
    case 'GET /professores/:id/turmas': exigir('ADMINISTRADOR'); return turmas.filter((t) => t.professorId === id).map((t) => turmaDto(t))
    case 'POST /professores':
    case 'PUT /professores/:id': {
      exigir('ADMINISTRADOR')
      const existente = rota.startsWith('PUT') ? professor(id) : undefined
      const registro = String(b.registro ?? '').trim().toUpperCase()
      const login = String(b.login ?? '').trim().toLowerCase()
      validar([
        [!String(b.nome ?? '').trim(), 'nome', 'Informe o nome.'],
        [!registro, 'registro', 'Informe o registro.'],
        [!String(b.especialidade ?? '').trim(), 'especialidade', 'Informe a especialidade.'],
        [!RE_LOGIN.test(login), 'login', 'Login inválido.'],
        [!!b.senha && !RE_SENHA.test(String(b.senha)), 'senha', 'A senha deve ter de 8 a 72 caracteres, com pelo menos uma letra e um número.'],
      ])
      if (!existente && !b.senha) erro(422, 'Informe a senha inicial do professor.')
      if (usuarios.some((u) => u.registro === registro && u.id !== existente?.id)) erro(409, `Já existe um professor com o registro ${registro}.`)
      if (loginEmUso(login, existente?.id)) erro(409, `O login ${login} já está em uso.`)
      const cursoIds = (b.cursoIds as number[] | undefined) ?? []
      if (existente) {
        const bloqueio = turmas.find((t) => t.professorId === existente.id && !cursoIds.includes(t.cursoId))
        if (bloqueio) erro(422, `O professor é responsável pela turma ${bloqueio.codigo}. Troque o responsável antes de remover o curso.`)
      }
      const alvo = existente ?? ({ id: novoId(), perfil: 'PROFESSOR', ativo: true, criadoEm: agora() } as UsuarioE)
      Object.assign(alvo, { nome: String(b.nome).trim(), registro, especialidade: String(b.especialidade).trim(), login, cursoIds, ...(b.senha ? { senha: String(b.senha) } : {}) })
      if (!existente) usuarios.push(alvo)
      registrar('PROFESSOR', `Professor ${existente ? 'atualizado' : 'cadastrado'}: ${alvo.nome}`)
      return professorDto(alvo)
    }
    case 'PATCH /professores/:id/ativo': {
      exigir('ADMINISTRADOR')
      const u = professor(id)
      const ativo = String(p.valor) === 'true'
      if (!ativo && turmas.some((t) => t.professorId === u.id && t.status === 'ABERTA'))
        erro(422, 'O professor é responsável por turmas abertas. Troque o responsável antes de desativá-lo.')
      u.ativo = ativo
      registrar('PROFESSOR', `Professor ${u.nome} ${ativo ? 'ativado' : 'desativado'}`)
      return professorDto(u)
    }

    // ---------- cursos
    case 'GET /cursos': {
      exigir('ADMINISTRADOR', 'PROFESSOR')
      const lista = cursos.filter((c) => (contem(c.nome, p.q) || contem(c.codigo, p.q)) && (!p.status || c.status === p.status) && (!p.modalidade || c.modalidade === p.modalidade))
      const pag = paginar(lista, p, 'nome')
      return { ...pag, conteudo: pag.conteudo.map(cursoDto) }
    }
    case 'GET /cursos/ativos': exigir('ADMINISTRADOR', 'PROFESSOR'); return cursos.filter((c) => c.status === 'ATIVO').sort((a, b) => a.nome.localeCompare(b.nome)).map(cursoResumo)
    case 'GET /cursos/:id': exigir('ADMINISTRADOR', 'PROFESSOR'); return cursoDto(curso(id))
    case 'GET /cursos/:id/turmas': exigir('ADMINISTRADOR'); return turmas.filter((t) => t.cursoId === id).map((t) => turmaDto(t))
    case 'POST /cursos':
    case 'PUT /cursos/:id': {
      exigir('ADMINISTRADOR')
      const existente = rota.startsWith('PUT') ? curso(id) : undefined
      const codigo = String(b.codigo ?? '').trim().toUpperCase()
      validar([
        [!RE_CODIGO.test(codigo), 'codigo', 'Use de 2 a 20 letras, números ou hífen.'],
        [!String(b.nome ?? '').trim(), 'nome', 'Informe o nome.'],
        [!(Number(b.cargaHoraria) > 0), 'cargaHoraria', 'A carga horária deve ser maior que zero.'],
      ])
      if (existente && existente.modalidade !== b.modalidade) erro(422, 'A modalidade de um curso não pode ser alterada.')
      if (b.modalidade === 'PRESENCIAL' && !b.sala) erro(422, 'Informe a sala de aula do curso presencial.')
      if (b.modalidade === 'EAD' && !b.plataforma) erro(422, 'Informe a plataforma virtual do curso EAD.')
      if (cursos.some((c) => c.codigo === codigo && c.id !== existente?.id)) erro(409, `Já existe um curso com o código ${codigo}.`)
      const alvo = existente ?? ({ id: novoId(), status: 'ATIVO', criadoEm: agora() } as CursoE)
      Object.assign(alvo, { codigo, nome: String(b.nome).trim(), cargaHoraria: Number(b.cargaHoraria), descricao: b.descricao as string | undefined, modalidade: b.modalidade, sala: b.sala as string | undefined, plataforma: b.plataforma as string | undefined })
      if (!existente) cursos.push(alvo)
      registrar('CURSO', `Curso ${existente ? 'atualizado' : 'cadastrado'}: ${codigo} — ${alvo.nome}`)
      return cursoDto(alvo)
    }
    case 'PATCH /cursos/:id/status': {
      exigir('ADMINISTRADOR')
      const c = curso(id)
      c.status = p.valor === 'ATIVO' ? 'ATIVO' : 'INATIVO'
      registrar('CURSO', `Curso ${c.codigo} ${c.status === 'ATIVO' ? 'ativado' : 'inativado'}`)
      return cursoDto(c)
    }

    // ---------- turmas
    case 'GET /turmas': {
      const u = exigir('ADMINISTRADOR', 'PROFESSOR')
      const lista = turmas.filter((t) => (contem(t.codigo, p.q) || contem(curso(t.cursoId).nome, p.q))
        && (!p.cursoId || t.cursoId === Number(p.cursoId))
        && (!p.status || t.status === p.status)
        && (u.perfil === 'PROFESSOR' ? t.professorId === u.id : !p.professorId || t.professorId === Number(p.professorId)))
      const pag = paginar(lista, p, 'codigo')
      return { ...pag, conteudo: pag.conteudo.map((t) => turmaDto(t)) }
    }
    case 'GET /turmas/:id': { const t = turma(id); acessoTurma(t); return turmaDto(t, true) }
    case 'POST /turmas':
    case 'PUT /turmas/:id': {
      exigir('ADMINISTRADOR')
      const existente = rota.startsWith('PUT') ? turma(id) : undefined
      const codigo = String(b.codigo ?? '').trim().toUpperCase()
      validar([
        [!RE_CODIGO.test(codigo), 'codigo', 'Use de 2 a 20 letras, números ou hífen.'],
        [!b.cursoId, 'cursoId', 'Selecione o curso.'],
        [!(Number(b.capacidadeMaxima) >= 1), 'capacidadeMaxima', 'A capacidade deve ser de pelo menos 1 aluno.'],
      ])
      if (turmas.some((t) => t.codigo === codigo && t.id !== existente?.id)) erro(409, `Já existe uma turma com o código ${codigo}.`)
      const c = curso(Number(b.cursoId))
      if (existente && existente.cursoId !== c.id && existente.alunoIds.length) erro(422, 'Não é possível trocar o curso de uma turma com alunos matriculados.')
      if (c.status !== 'ATIVO' && c.id !== existente?.cursoId) erro(422, 'Não é possível associar a turma a um curso inativo.')
      if (b.professorId) {
        const prof = professor(Number(b.professorId))
        if (!prof.ativo) erro(422, `O professor ${prof.nome} está inativo.`)
        if (!prof.cursoIds?.includes(c.id)) erro(422, `O professor ${prof.nome} não está associado ao curso ${c.codigo}.`)
      }
      if (existente && Number(b.capacidadeMaxima) < existente.alunoIds.length) erro(422, `A capacidade não pode ser menor que o número de alunos matriculados (${existente.alunoIds.length}).`)
      const alvo = existente ?? ({ id: novoId(), alunoIds: [] as number[] } as TurmaE)
      Object.assign(alvo, { codigo, cursoId: c.id, professorId: b.professorId ? Number(b.professorId) : null, capacidadeMaxima: Number(b.capacidadeMaxima), status: (b.status as TurmaE['status']) ?? 'ABERTA' })
      if (!existente) turmas.push(alvo)
      registrar('TURMA', `Turma ${existente ? 'atualizada' : 'criada'}: ${codigo}`)
      return turmaDto(alvo, true)
    }
    case 'POST /turmas/:id/alunos': {
      exigir('ADMINISTRADOR')
      const t = turma(id)
      const a = aluno(Number(b.alunoId))
      if (t.status !== 'ABERTA') erro(422, `A turma ${t.codigo} não está aberta para matrículas.`)
      if (!a.ativo) erro(422, `O aluno ${a.matricula} está inativo.`)
      if (t.alunoIds.includes(a.id)) erro(422, `O aluno ${a.matricula} já está matriculado na turma ${t.codigo}.`)
      if (t.alunoIds.length >= t.capacidadeMaxima) erro(422, `A turma ${t.codigo} está lotada (${t.capacidadeMaxima} vagas).`)
      if (a.cursoId !== t.cursoId) erro(422, `O aluno pertence ao curso ${curso(a.cursoId!).codigo} e a turma ao curso ${curso(t.cursoId).codigo}.`)
      t.alunoIds.push(a.id)
      registrar('MATRICULA', `Aluno ${a.matricula} matriculado na turma ${t.codigo}`)
      return turmaDto(t, true)
    }
    case 'DELETE /turmas/:id/alunos/:id': {
      exigir('ADMINISTRADOR')
      const t = turma(id)
      const alunoId = Number(seg[3])
      if (!t.alunoIds.includes(alunoId)) erro(422, 'O aluno não está matriculado nesta turma.')
      t.alunoIds = t.alunoIds.filter((x) => x !== alunoId)
      registrar('MATRICULA', `Aluno ${usuario(alunoId).matricula} removido da turma ${t.codigo}`)
      return turmaDto(t, true)
    }

    // ---------- avaliações
    case 'GET /avaliacoes': {
      const u = exigir('ADMINISTRADOR', 'PROFESSOR')
      const lista = avaliacoes.filter((a) => (!p.turmaId || a.turmaId === Number(p.turmaId))
        && (!p.alunoId || a.alunoId === Number(p.alunoId))
        && (!p.cursoId || turma(a.turmaId).cursoId === Number(p.cursoId))
        && (u.perfil !== 'PROFESSOR' || turma(a.turmaId).professorId === u.id))
      const pag = paginar(lista, { ...p, sort: p.sort ?? 'data,desc' }, 'data')
      return { ...pag, conteudo: pag.conteudo.map(avaliacaoDto) }
    }
    case 'POST /avaliacoes':
    case 'PUT /avaliacoes/:id': {
      const u = exigir('ADMINISTRADOR', 'PROFESSOR')
      const existente = rota.startsWith('PUT') ? (avaliacoes.find((a) => a.id === id) ?? erro(404, `Avaliação não encontrado(a): ${id}`)) : undefined
      const nota = Number(b.nota)
      validar([
        [!String(b.descricao ?? '').trim(), 'descricao', 'Informe a descrição.'],
        [Number.isNaN(nota), 'nota', 'Informe a nota.'],
        [nota < 0, 'nota', 'A nota mínima é 0.'],
        [nota > 10, 'nota', 'A nota máxima é 10.'],
        [!b.data, 'data', 'Informe a data.'],
        [String(b.data) > hoje(), 'data', 'A data não pode estar no futuro.'],
      ])
      const t = turma(existente?.turmaId ?? Number(b.turmaId))
      acessoTurma(t)
      if (existente) {
        if (u.perfil === 'PROFESSOR' && t.status !== 'ABERTA') erro(422, `A turma ${t.codigo} não está aberta. Solicite a correção a um administrador.`)
        Object.assign(existente, { descricao: String(b.descricao).trim(), nota, data: String(b.data), atualizadoEm: agora() })
        registrar('AVALIACAO', `Avaliação atualizada na turma ${t.codigo}`)
        return avaliacaoDto(existente)
      }
      const a = aluno(Number(b.alunoId))
      if (!t.alunoIds.includes(a.id)) erro(422, `O aluno ${a.matricula} não está matriculado na turma ${t.codigo}.`)
      if (t.status !== 'ABERTA') erro(422, `A turma ${t.codigo} não está aberta para novas avaliações.`)
      const nova: AvalE = { id: novoId(), alunoId: a.id, turmaId: t.id, descricao: String(b.descricao).trim(), nota, data: String(b.data), atualizadoEm: agora() }
      avaliacoes.push(nova)
      registrar('AVALIACAO', `Avaliação "${nova.descricao}" lançada na turma ${t.codigo}`)
      return avaliacaoDto(nova)
    }
    case 'DELETE /avaliacoes/:id': {
      exigir('ADMINISTRADOR')
      const i = avaliacoes.findIndex((a) => a.id === id)
      if (i < 0) erro(404, `Avaliação não encontrado(a): ${id}`)
      const [rem] = avaliacoes.splice(i, 1)
      registrar('AVALIACAO', `Avaliação excluída da turma ${turma(rem.turmaId).codigo}`)
      return undefined
    }

    // ---------- relatórios
    case 'GET /relatorios':
      exigir('ADMINISTRADOR')
      return [
        { tipo: 'alunos', titulo: 'Alunos cadastrados', descricao: 'Matrícula, curso, quantidade de turmas e situação do cadastro.' },
        { tipo: 'professores', titulo: 'Professores', descricao: 'Registro, especialidade, cursos e turmas de cada professor.' },
        { tipo: 'cursos', titulo: 'Cursos', descricao: 'Cursos presenciais e EAD com carga horária, status e local das aulas.' },
        { tipo: 'turmas', titulo: 'Turmas e matrículas', descricao: 'Ocupação das turmas, professor responsável e status.' },
        { tipo: 'notas', titulo: 'Notas e médias', descricao: 'Avaliações lançadas, com filtros por curso, turma e período.' },
        { tipo: 'desempenho', titulo: 'Desempenho acadêmico', descricao: 'Média e situação de cada aluno por turma, segundo os critérios configurados.' },
      ]
    // ---------- usuários
    case 'GET /usuarios': {
      exigir('ADMINISTRADOR')
      const pag = paginar(usuarios.filter((u) => contem(u.nome, p.q) || contem(u.login, p.q)), p, 'nome')
      return { ...pag, conteudo: pag.conteudo.map((u) => ({ id: u.id, nome: u.nome, login: u.login, perfil: u.perfil, identificacao: u.matricula ?? u.registro ?? u.login, ativo: u.ativo, criadoEm: u.criadoEm })) }
    }
    case 'POST /usuarios/administradores': {
      exigir('ADMINISTRADOR')
      const login = String(b.login ?? '').trim().toLowerCase()
      validar([
        [!String(b.nome ?? '').trim(), 'nome', 'Informe o nome.'],
        [!RE_LOGIN.test(login), 'login', 'Login inválido.'],
        [!RE_SENHA.test(String(b.senha ?? '')), 'senha', 'A senha deve ter de 8 a 72 caracteres, com pelo menos uma letra e um número.'],
      ])
      if (loginEmUso(login)) erro(409, `O login ${login} já está em uso.`)
      const u: UsuarioE = { id: novoId(), nome: String(b.nome).trim(), login, senha: String(b.senha), perfil: 'ADMINISTRADOR', ativo: true, criadoEm: agora() }
      usuarios.push(u)
      registrar('USUARIO', `Administrador cadastrado: ${login}`)
      return { ...u, identificacao: login }
    }
    case 'PATCH /usuarios/:id/ativo': {
      const atual = exigir('ADMINISTRADOR')
      const u = usuario(id)
      const ativo = String(p.valor) === 'true'
      if (!ativo && u.id === atual.id) erro(422, 'Você não pode desativar a própria conta.')
      if (!ativo && u.perfil === 'ADMINISTRADOR' && usuarios.filter((x) => x.perfil === 'ADMINISTRADOR' && x.ativo).length <= 1)
        erro(422, 'O sistema precisa de pelo menos um administrador ativo.')
      u.ativo = ativo
      registrar('USUARIO', `Conta ${u.login} ${ativo ? 'ativada' : 'desativada'}`)
      return { id: u.id, nome: u.nome, login: u.login, perfil: u.perfil, identificacao: u.matricula ?? u.registro ?? u.login, ativo: u.ativo, criadoEm: u.criadoEm }
    }
    case 'PUT /usuarios/:id/senha': {
      exigir('ADMINISTRADOR')
      validar([[!RE_SENHA.test(String(b.novaSenha ?? '')), 'novaSenha', 'A senha deve ter de 8 a 72 caracteres, com pelo menos uma letra e um número.']])
      usuario(id).senha = String(b.novaSenha)
      return undefined
    }

    // ---------- configurações
    case 'GET /configuracoes': exigir(); return { ...config, criterioConfigurado: config.mediaMinimaAprovacao !== null }
    case 'PUT /configuracoes': {
      exigir('ADMINISTRADOR')
      const ap = b.mediaMinimaAprovacao as number | null
      const rec = b.mediaMinimaRecuperacao as number | null
      if (rec !== null && ap === null) erro(422, 'Defina a média de aprovação antes da média de recuperação.')
      if (rec !== null && ap !== null && rec >= ap) erro(422, 'A média de recuperação deve ser menor que a média de aprovação.')
      Object.assign(config, { mediaMinimaAprovacao: ap, mediaMinimaRecuperacao: rec, quantidadeMinimaAvaliacoes: Number(b.quantidadeMinimaAvaliacoes), atualizadoEm: agora() })
      registrar('CONFIGURACAO', 'Critérios acadêmicos atualizados')
      return { ...config, criterioConfigurado: ap !== null }
    }
  }

  if (metodo === 'GET' && seg[0] === 'relatorios' && seg.length === 2) {
    exigir('ADMINISTRADOR')
    return relatorio(seg[1], p)
  }
  erro(404, 'Recurso não encontrado.')
}

/** Restaura a sessão simulada a partir do token salvo (demo-<id>). */
export function restaurarSessao(token: string | null) {
  const id = token?.startsWith('demo-') ? Number(token.slice(5)) : NaN
  usuarioAtual = usuarios.find((u) => u.id === id && u.ativo) ?? null
}
