package com.educonnect.model;

public enum StatusTurma {
    /** Aceita novas matrículas e lançamento de avaliações. */
    ABERTA,
    /** Período letivo concluído: sem novas matrículas; histórico preservado. */
    ENCERRADA,
    /** Turma cancelada antes da conclusão. */
    CANCELADA
}
