import type {
  Aluno,
  AlunoRequest,
  Avaliacao,
  AvaliacaoRequest,
  Configuracao,
  Curso,
  CursoRequest,
  CursoResumo,
  Dashboard,
  Desempenho,
  FiltroRelatorio,
  LoginResponse,
  Pagina,
  Professor,
  ProfessorRequest,
  Relatorio,
  StatusCurso,
  StatusTurma,
  TipoRelatorio,
  Turma,
  TurmaRequest,
  Usuario,
  UsuarioLogado,
  Modalidade,
} from '../types'
import { api } from './api'

export interface ParametrosPagina {
  page?: number
  size?: number
  sort?: string
}

export const authService = {
  login: (login: string, senha: string) => api.post<LoginResponse>('/auth/login', { login, senha }),
  me: () => api.get<UsuarioLogado>('/auth/me'),
  alterarSenha: (senhaAtual: string, novaSenha: string) => api.post<void>('/auth/senha', { senhaAtual, novaSenha }),
  /** Contas de exemplo para a tela de login; só existe quando o backend roda no perfil "demo". */
  contasExemplo: () =>
    api.get<{ senha: string; contas: { login: string; perfil: string }[] }>('/auth/contas-exemplo'),
}

export const dashboardService = {
  obter: () => api.get<Dashboard>('/dashboard'),
}

export const alunoService = {
  listar: (p: ParametrosPagina & { q?: string; cursoId?: number; turmaId?: number; ativo?: boolean }) =>
    api.get<Pagina<Aluno>>('/alunos', { ...p }),
  buscar: (id: number) => api.get<Aluno>(`/alunos/${id}`),
  criar: (dados: AlunoRequest) => api.post<Aluno>('/alunos', dados),
  atualizar: (id: number, dados: AlunoRequest) => api.put<Aluno>(`/alunos/${id}`, dados),
  alterarAtivo: (id: number, valor: boolean) => api.patch<Aluno>(`/alunos/${id}/ativo`, { valor }),
  avaliacoes: (id: number) => api.get<Avaliacao[]>(`/alunos/${id}/avaliacoes`),
  desempenho: (id: number) => api.get<Desempenho>(`/alunos/${id}/desempenho`),
}

export const meuPerfilService = {
  dados: () => api.get<Aluno>('/me'),
  avaliacoes: () => api.get<Avaliacao[]>('/me/avaliacoes'),
  desempenho: () => api.get<Desempenho>('/me/desempenho'),
}

export const professorService = {
  listar: (p: ParametrosPagina & { q?: string; ativo?: boolean; cursoId?: number }) =>
    api.get<Pagina<Professor>>('/professores', { ...p }),
  buscar: (id: number) => api.get<Professor>(`/professores/${id}`),
  turmas: (id: number) => api.get<Turma[]>(`/professores/${id}/turmas`),
  criar: (dados: ProfessorRequest) => api.post<Professor>('/professores', dados),
  atualizar: (id: number, dados: ProfessorRequest) => api.put<Professor>(`/professores/${id}`, dados),
  alterarAtivo: (id: number, valor: boolean) => api.patch<Professor>(`/professores/${id}/ativo`, { valor }),
}

export const cursoService = {
  listar: (p: ParametrosPagina & { q?: string; status?: StatusCurso; modalidade?: Modalidade }) =>
    api.get<Pagina<Curso>>('/cursos', { ...p }),
  ativos: () => api.get<CursoResumo[]>('/cursos/ativos'),
  buscar: (id: number) => api.get<Curso>(`/cursos/${id}`),
  turmas: (id: number) => api.get<Turma[]>(`/cursos/${id}/turmas`),
  criar: (dados: CursoRequest) => api.post<Curso>('/cursos', dados),
  atualizar: (id: number, dados: CursoRequest) => api.put<Curso>(`/cursos/${id}`, dados),
  alterarStatus: (id: number, valor: StatusCurso) => api.patch<Curso>(`/cursos/${id}/status`, { valor }),
}

export const turmaService = {
  listar: (p: ParametrosPagina & { q?: string; cursoId?: number; professorId?: number; status?: StatusTurma }) =>
    api.get<Pagina<Turma>>('/turmas', { ...p }),
  buscar: (id: number) => api.get<Turma>(`/turmas/${id}`),
  criar: (dados: TurmaRequest) => api.post<Turma>('/turmas', dados),
  atualizar: (id: number, dados: TurmaRequest) => api.put<Turma>(`/turmas/${id}`, dados),
  matricular: (id: number, alunoId: number) => api.post<Turma>(`/turmas/${id}/alunos`, { alunoId }),
  desmatricular: (id: number, alunoId: number) => api.delete<Turma>(`/turmas/${id}/alunos/${alunoId}`),
}

export const avaliacaoService = {
  listar: (p: ParametrosPagina & { turmaId?: number; alunoId?: number; cursoId?: number }) =>
    api.get<Pagina<Avaliacao>>('/avaliacoes', { ...p }),
  criar: (dados: AvaliacaoRequest) => api.post<Avaliacao>('/avaliacoes', dados),
  atualizar: (id: number, dados: Omit<AvaliacaoRequest, 'alunoId' | 'turmaId'>) =>
    api.put<Avaliacao>(`/avaliacoes/${id}`, dados),
  excluir: (id: number) => api.delete<void>(`/avaliacoes/${id}`),
}

export const relatorioService = {
  tipos: () => api.get<TipoRelatorio[]>('/relatorios'),
  gerar: (tipo: string, filtro: FiltroRelatorio) => api.get<Relatorio>(`/relatorios/${tipo}`, { ...filtro }),
  baixar: (tipo: string, formato: 'csv' | 'pdf', filtro: FiltroRelatorio) =>
    api.baixar(`/relatorios/${tipo}/${formato}`, { ...filtro }, `relatorio-${tipo}.${formato}`),
}

export const usuarioService = {
  listar: (p: ParametrosPagina & { q?: string }) => api.get<Pagina<Usuario>>('/usuarios', { ...p }),
  criarAdministrador: (dados: { nome: string; login: string; senha: string }) =>
    api.post<Usuario>('/usuarios/administradores', dados),
  alterarAtivo: (id: number, valor: boolean) => api.patch<Usuario>(`/usuarios/${id}/ativo`, { valor }),
  redefinirSenha: (id: number, novaSenha: string) => api.put<void>(`/usuarios/${id}/senha`, { novaSenha }),
}

export const configuracaoService = {
  obter: () => api.get<Configuracao>('/configuracoes'),
  atualizar: (dados: {
    mediaMinimaAprovacao: number | null
    mediaMinimaRecuperacao: number | null
    quantidadeMinimaAvaliacoes: number
  }) => api.put<Configuracao>('/configuracoes', dados),
}
