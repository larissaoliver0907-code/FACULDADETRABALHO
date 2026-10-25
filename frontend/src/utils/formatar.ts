import type { SituacaoAcademica, StatusTurma } from '../types'

export function formatarNota(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatarData(iso: string | null | undefined) {
  if (!iso) return '—'
  // Datas sem horário (AAAA-MM-DD) são tratadas como locais para não deslocar o dia.
  const data = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
  return data.toLocaleDateString('pt-BR')
}

export function formatarDataHora(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function tempoRelativo(iso: string) {
  const segundos = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (segundos < 60) return 'agora mesmo'
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  return dias === 1 ? 'ontem' : `há ${dias} dias`
}

export function hojeISO() {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

export const rotuloStatusTurma: Record<StatusTurma, string> = {
  ABERTA: 'Aberta',
  ENCERRADA: 'Encerrada',
  CANCELADA: 'Cancelada',
}

export const corStatusTurma = { ABERTA: 'verde', ENCERRADA: 'cinza', CANCELADA: 'vermelho' } as const

export const corSituacao: Record<SituacaoAcademica, 'verde' | 'amarelo' | 'vermelho' | 'cinza' | 'azul'> = {
  APROVADO: 'verde',
  RECUPERACAO: 'amarelo',
  REPROVADO: 'vermelho',
  SEM_AVALIACOES: 'cinza',
  AVALIACOES_INSUFICIENTES: 'cinza',
  CRITERIO_NAO_CONFIGURADO: 'azul',
}

export function iniciais(nome: string) {
  return nome
    .replace(/\[.*?\]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
