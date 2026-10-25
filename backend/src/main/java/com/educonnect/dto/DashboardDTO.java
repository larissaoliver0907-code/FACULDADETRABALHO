package com.educonnect.dto;

import com.educonnect.model.Atividade;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class DashboardDTO {

    private DashboardDTO() {
    }

    public record ItemSerie(String rotulo, long valor) {
    }

    public record AtividadeResponse(String tipo, String descricao, String usuario, LocalDateTime criadoEm) {
        public static AtividadeResponse de(Atividade a) {
            return new AtividadeResponse(a.getTipo(), a.getDescricao(), a.getUsuario(), a.getCriadoEm());
        }
    }

    public record Response(
            long totalAlunos,
            long totalProfessores,
            long totalCursos,
            long totalTurmas,
            BigDecimal mediaGeral,
            long matriculasAtivas,
            boolean criterioConfigurado,
            List<ItemSerie> alunosPorCurso,
            List<ItemSerie> distribuicaoNotas,
            List<ItemSerie> situacaoAcademica,
            List<AtividadeResponse> atividadesRecentes) {
    }
}
