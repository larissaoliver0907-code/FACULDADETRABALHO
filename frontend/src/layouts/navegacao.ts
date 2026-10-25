import {
  BookOpen,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  School,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Perfil } from '../types'

export interface ItemNavegacao {
  rotulo: string
  caminho: string
  icone: LucideIcon
  perfis: Perfil[]
}

/** Itens do menu lateral; cada página só aparece para os perfis autorizados. */
export const navegacao: ItemNavegacao[] = [
  { rotulo: 'Dashboard', caminho: '/', icone: LayoutDashboard, perfis: ['ADMINISTRADOR', 'PROFESSOR'] },
  { rotulo: 'Meu painel', caminho: '/meu-painel', icone: LayoutDashboard, perfis: ['ALUNO'] },
  { rotulo: 'Alunos', caminho: '/alunos', icone: GraduationCap, perfis: ['ADMINISTRADOR'] },
  { rotulo: 'Professores', caminho: '/professores', icone: Users, perfis: ['ADMINISTRADOR'] },
  { rotulo: 'Cursos', caminho: '/cursos', icone: BookOpen, perfis: ['ADMINISTRADOR', 'PROFESSOR'] },
  { rotulo: 'Turmas', caminho: '/turmas', icone: School, perfis: ['ADMINISTRADOR', 'PROFESSOR'] },
  { rotulo: 'Avaliações', caminho: '/avaliacoes', icone: ClipboardList, perfis: ['ADMINISTRADOR', 'PROFESSOR'] },
  { rotulo: 'Minhas notas', caminho: '/minhas-notas', icone: ClipboardList, perfis: ['ALUNO'] },
  { rotulo: 'Relatórios', caminho: '/relatorios', icone: FileBarChart, perfis: ['ADMINISTRADOR'] },
  { rotulo: 'Usuários e permissões', caminho: '/usuarios', icone: ShieldCheck, perfis: ['ADMINISTRADOR'] },
  { rotulo: 'Configurações', caminho: '/configuracoes', icone: Settings, perfis: ['ADMINISTRADOR', 'PROFESSOR', 'ALUNO'] },
]

export const rotuloPerfil: Record<Perfil, string> = {
  ADMINISTRADOR: 'Administrador',
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
}

export function paginaInicial(perfil: Perfil) {
  return perfil === 'ALUNO' ? '/meu-painel' : '/'
}
