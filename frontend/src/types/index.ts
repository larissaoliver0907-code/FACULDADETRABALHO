// Contratos da API do EduConnect (espelham os DTOs do backend).

export type Perfil = 'ALUNO' | 'PROFESSOR' | 'ADMINISTRADOR'
export type Modalidade = 'PRESENCIAL' | 'EAD'
export type StatusCurso = 'ATIVO' | 'INATIVO'
export type StatusTurma = 'ABERTA' | 'ENCERRADA' | 'CANCELADA'
export type SituacaoAcademica =
  | 'SEM_AVALIACOES'
  | 'AVALIACOES_INSUFICIENTES'
  | 'CRITERIO_NAO_CONFIGURADO'
  | 'APROVADO'
  | 'RECUPERACAO'
  | 'REPROVADO'

export interface Pagina<T> {
  conteudo: T[]
  pagina: number
  tamanho: number
  totalElementos: number
  totalPaginas: number
}

export interface UsuarioLogado {
  id: number
  nome: string
  login: string
  perfil: Perfil
  identificacao: string
}

export interface LoginResponse {
  token: string
  expiraEm: string
  usuario: UsuarioLogado
}

export interface CursoResumo {
  id: number
  codigo: string
  nome: string
  modalidade: Modalidade
}

export interface Curso {
  id: number
  codigo: string
  nome: string
  cargaHoraria: number
  descricao?: string
  status: StatusCurso
  modalidade: Modalidade
  sala?: string
  plataforma?: string
  localAulas: string
  quantidadeTurmas?: number
  criadoEm: string
}

export interface CursoRequest {
  codigo: string
  nome: string
  cargaHoraria: number
  descricao?: string
  modalidade: Modalidade
  sala?: string
  plataforma?: string
}

export interface AlunoResumo {
  id: number
  nome: string
  matricula: string
  ativo: boolean
}

export interface TurmaResumo {
  id: number
  codigo: string
  cursoNome: string
}

export interface Aluno {
  id: number
  nome: string
  matricula: string
  login: string
  ativo: boolean
  curso: CursoResumo
  turmas?: TurmaResumo[]
  criadoEm: string
}

export interface AlunoRequest {
  nome: string
  matricula: string
  cursoId: number
  login: string
  senha?: string
}

export interface ProfessorResumo {
  id: number
  nome: string
  registro: string
}

export interface Professor {
  id: number
  nome: string
  registro: string
  especialidade: string
  login: string
  ativo: boolean
  cursos: CursoResumo[]
  quantidadeTurmas: number
  criadoEm: string
}

export interface ProfessorRequest {
  nome: string
  registro: string
  especialidade: string
  login: string
  senha?: string
  cursoIds: number[]
}

export interface Turma {
  id: number
  codigo: string
  curso: CursoResumo
  professor?: ProfessorResumo
  capacidadeMaxima: number
  matriculados: number
  vagasDisponiveis: number
  status: StatusTurma
  resumo: string
  alunos?: AlunoResumo[]
}

export interface TurmaRequest {
  codigo: string
  cursoId: number
  professorId?: number | null
  capacidadeMaxima: number
  status?: StatusTurma
}

export interface Avaliacao {
  id: number
  aluno: AlunoResumo
  turma: TurmaResumo
  descricao: string
  nota: number
  data: string
  atualizadoEm: string
}

export interface AvaliacaoRequest {
  alunoId: number
  turmaId: number
  descricao: string
  nota: number
  data: string
}

export interface DesempenhoTurma {
  turma: TurmaResumo
  quantidadeAvaliacoes: number
  media: number | null
  situacao: SituacaoAcademica
  situacaoDescricao: string
}

export interface Desempenho {
  aluno: AlunoResumo
  mediaGeral: number | null
  totalAvaliacoes: number
  criterioConfigurado: boolean
  turmas: DesempenhoTurma[]
}

export interface Configuracao {
  mediaMinimaAprovacao: number | null
  mediaMinimaRecuperacao: number | null
  quantidadeMinimaAvaliacoes: number
  criterioConfigurado: boolean
  atualizadoEm: string
}

export interface ItemSerie {
  rotulo: string
  valor: number
}

export interface Atividade {
  tipo: string
  descricao: string
  usuario?: string
  criadoEm: string
}

export interface Dashboard {
  totalAlunos: number
  totalProfessores: number
  totalCursos: number
  totalTurmas: number
  mediaGeral: number | null
  matriculasAtivas: number
  criterioConfigurado: boolean
  alunosPorCurso: ItemSerie[]
  distribuicaoNotas: ItemSerie[]
  situacaoAcademica: ItemSerie[]
  atividadesRecentes: Atividade[]
}

export interface Usuario {
  id: number
  nome: string
  login: string
  perfil: Perfil
  identificacao: string
  ativo: boolean
  criadoEm: string
}

export interface TipoRelatorio {
  tipo: string
  titulo: string
  descricao: string
}

export interface FiltroRelatorio {
  cursoId?: number
  turmaId?: number
  inicio?: string
  fim?: string
}

export interface Relatorio {
  tipo: string
  titulo: string
  colunas: string[]
  linhas: Record<string, string | number | null>[]
  resumo: Record<string, string | number | null>
  geradoEm: string
}

export interface ErroApi {
  status: number
  mensagem: string
  campos?: Record<string, string>
}
