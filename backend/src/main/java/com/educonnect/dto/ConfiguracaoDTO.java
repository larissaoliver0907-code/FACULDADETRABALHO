package com.educonnect.dto;

import com.educonnect.model.ConfiguracaoAcademica;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class ConfiguracaoDTO {

    private ConfiguracaoDTO() {
    }

    public record Request(
            @DecimalMin(value = "0.0", message = "Valor mínimo: 0.") @DecimalMax(value = "10.0", message = "Valor máximo: 10.")
            BigDecimal mediaMinimaAprovacao,
            @DecimalMin(value = "0.0", message = "Valor mínimo: 0.") @DecimalMax(value = "10.0", message = "Valor máximo: 10.")
            BigDecimal mediaMinimaRecuperacao,
            @NotNull(message = "Informe a quantidade mínima de avaliações.")
            @Min(value = 1, message = "Mínimo de 1 avaliação.") @Max(value = 50, message = "Máximo de 50 avaliações.")
            Integer quantidadeMinimaAvaliacoes) {
    }

    public record Response(BigDecimal mediaMinimaAprovacao, BigDecimal mediaMinimaRecuperacao,
                           int quantidadeMinimaAvaliacoes, boolean criterioConfigurado, LocalDateTime atualizadoEm) {
        public static Response de(ConfiguracaoAcademica c) {
            return new Response(c.getMediaMinimaAprovacao(), c.getMediaMinimaRecuperacao(),
                    c.getQuantidadeMinimaAvaliacoes(), c.isCriterioConfigurado(), c.getAtualizadoEm());
        }
    }
}
