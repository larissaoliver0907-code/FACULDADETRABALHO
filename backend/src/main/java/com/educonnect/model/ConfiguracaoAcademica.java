package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Collection;

/**
 * Critérios acadêmicos definidos pela instituição (registro único, id = 1).
 * <p>
 * O sistema não presume critérios oficiais: enquanto a média mínima de aprovação não for
 * configurada, a situação dos alunos é informada como {@link SituacaoAcademica#CRITERIO_NAO_CONFIGURADO}.
 */
@Entity
@Table(name = "configuracao_academica")
public class ConfiguracaoAcademica {

    public static final long ID_UNICO = 1L;

    @Id
    private Long id = ID_UNICO;

    @Column(name = "media_minima_aprovacao", precision = 4, scale = 2)
    private BigDecimal mediaMinimaAprovacao;

    /** Opcional: médias entre este valor e a média de aprovação ficam em recuperação. */
    @Column(name = "media_minima_recuperacao", precision = 4, scale = 2)
    private BigDecimal mediaMinimaRecuperacao;

    @Column(name = "quantidade_minima_avaliacoes", nullable = false)
    private int quantidadeMinimaAvaliacoes = 1;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    public ConfiguracaoAcademica() {
    }

    public void atualizar(BigDecimal mediaAprovacao, BigDecimal mediaRecuperacao, int quantidadeMinima) {
        validarFaixa(mediaAprovacao, "média mínima de aprovação");
        validarFaixa(mediaRecuperacao, "média mínima de recuperação");
        if (mediaRecuperacao != null) {
            if (mediaAprovacao == null) {
                throw new RegraNegocioException("Defina a média de aprovação antes da média de recuperação.");
            }
            if (mediaRecuperacao.compareTo(mediaAprovacao) >= 0) {
                throw new RegraNegocioException("A média de recuperação deve ser menor que a média de aprovação.");
            }
        }
        if (quantidadeMinima < 1) {
            throw new RegraNegocioException("A quantidade mínima de avaliações deve ser pelo menos 1.");
        }
        this.mediaMinimaAprovacao = mediaAprovacao;
        this.mediaMinimaRecuperacao = mediaRecuperacao;
        this.quantidadeMinimaAvaliacoes = quantidadeMinima;
        this.atualizadoEm = LocalDateTime.now();
    }

    private static void validarFaixa(BigDecimal valor, String campo) {
        if (valor != null && (valor.compareTo(BigDecimal.ZERO) < 0 || valor.compareTo(BigDecimal.TEN) > 0)) {
            throw new RegraNegocioException("A " + campo + " deve estar entre 0 e 10.");
        }
    }

    public boolean isCriterioConfigurado() {
        return mediaMinimaAprovacao != null;
    }

    /** Média aritmética das notas, com duas casas decimais; {@code null} quando não há notas. */
    public static BigDecimal calcularMedia(Collection<BigDecimal> notas) {
        if (notas == null || notas.isEmpty()) {
            return null;
        }
        BigDecimal soma = BigDecimal.ZERO;
        for (BigDecimal nota : notas) {
            soma = soma.add(nota);
        }
        return soma.divide(BigDecimal.valueOf(notas.size()), 2, RoundingMode.HALF_UP);
    }

    /** Situação acadêmica para um conjunto de notas, segundo os critérios configurados. */
    public SituacaoAcademica avaliarSituacao(Collection<BigDecimal> notas) {
        if (notas == null || notas.isEmpty()) {
            return SituacaoAcademica.SEM_AVALIACOES;
        }
        if (!isCriterioConfigurado()) {
            return SituacaoAcademica.CRITERIO_NAO_CONFIGURADO;
        }
        if (notas.size() < quantidadeMinimaAvaliacoes) {
            return SituacaoAcademica.AVALIACOES_INSUFICIENTES;
        }
        BigDecimal media = calcularMedia(notas);
        if (media.compareTo(mediaMinimaAprovacao) >= 0) {
            return SituacaoAcademica.APROVADO;
        }
        if (mediaMinimaRecuperacao != null && media.compareTo(mediaMinimaRecuperacao) >= 0) {
            return SituacaoAcademica.RECUPERACAO;
        }
        return SituacaoAcademica.REPROVADO;
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getMediaMinimaAprovacao() {
        return mediaMinimaAprovacao;
    }

    public BigDecimal getMediaMinimaRecuperacao() {
        return mediaMinimaRecuperacao;
    }

    public int getQuantidadeMinimaAvaliacoes() {
        return quantidadeMinimaAvaliacoes;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}
