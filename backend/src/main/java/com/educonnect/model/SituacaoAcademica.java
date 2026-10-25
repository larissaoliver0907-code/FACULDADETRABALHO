package com.educonnect.model;

/** Situação do aluno calculada a partir da média e dos critérios configurados pela instituição. */
public enum SituacaoAcademica {
    SEM_AVALIACOES("Sem avaliações"),
    AVALIACOES_INSUFICIENTES("Avaliações insuficientes"),
    CRITERIO_NAO_CONFIGURADO("Critério não configurado"),
    APROVADO("Aprovado"),
    RECUPERACAO("Recuperação"),
    REPROVADO("Reprovado");

    private final String descricao;

    SituacaoAcademica(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
