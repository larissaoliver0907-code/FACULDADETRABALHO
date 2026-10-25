package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ConfiguracaoAcademicaTest {

    private static List<BigDecimal> notas(String... valores) {
        return java.util.Arrays.stream(valores).map(BigDecimal::new).toList();
    }

    @Test
    @DisplayName("Calcula a média aritmética com duas casas decimais")
    void calculoDeMedia() {
        assertThat(ConfiguracaoAcademica.calcularMedia(notas("7", "8", "9"))).isEqualByComparingTo("8.00");
        assertThat(ConfiguracaoAcademica.calcularMedia(notas("7", "8"))).isEqualByComparingTo("7.50");
        assertThat(ConfiguracaoAcademica.calcularMedia(notas("10", "5", "6"))).isEqualByComparingTo("7.00");
        assertThat(ConfiguracaoAcademica.calcularMedia(notas("6.67", "6.67", "6.66"))).isEqualByComparingTo("6.67");
        assertThat(ConfiguracaoAcademica.calcularMedia(List.of())).isNull();
    }

    @Test
    @DisplayName("Sem critério configurado, a situação não é presumida")
    void semCriterio() {
        ConfiguracaoAcademica config = new ConfiguracaoAcademica();
        assertThat(config.isCriterioConfigurado()).isFalse();
        assertThat(config.avaliarSituacao(notas("9"))).isEqualTo(SituacaoAcademica.CRITERIO_NAO_CONFIGURADO);
        assertThat(config.avaliarSituacao(List.of())).isEqualTo(SituacaoAcademica.SEM_AVALIACOES);
    }

    @Test
    @DisplayName("Aplica médias de aprovação e recuperação configuradas pela instituição")
    void criteriosConfigurados() {
        ConfiguracaoAcademica config = new ConfiguracaoAcademica();
        config.atualizar(new BigDecimal("7"), new BigDecimal("5"), 2);

        assertThat(config.avaliarSituacao(notas("8"))).isEqualTo(SituacaoAcademica.AVALIACOES_INSUFICIENTES);
        assertThat(config.avaliarSituacao(notas("7", "7"))).isEqualTo(SituacaoAcademica.APROVADO);
        assertThat(config.avaliarSituacao(notas("6", "5"))).isEqualTo(SituacaoAcademica.RECUPERACAO);
        assertThat(config.avaliarSituacao(notas("4", "5"))).isEqualTo(SituacaoAcademica.REPROVADO);
    }

    @Test
    @DisplayName("Rejeita configurações inconsistentes")
    void configuracoesInvalidas() {
        ConfiguracaoAcademica config = new ConfiguracaoAcademica();
        assertThatThrownBy(() -> config.atualizar(new BigDecimal("11"), null, 1)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> config.atualizar(new BigDecimal("6"), new BigDecimal("7"), 1)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> config.atualizar(null, new BigDecimal("4"), 1)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> config.atualizar(new BigDecimal("6"), null, 0)).isInstanceOf(RegraNegocioException.class);
    }
}
