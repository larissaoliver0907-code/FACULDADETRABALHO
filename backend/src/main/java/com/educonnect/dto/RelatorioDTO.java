package com.educonnect.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class RelatorioDTO {

    private RelatorioDTO() {
    }

    /** Filtros opcionais aplicados pelos geradores que os suportam. */
    public record Filtro(Long cursoId, Long turmaId, LocalDate inicio, LocalDate fim) {
        public static Filtro vazio() {
            return new Filtro(null, null, null, null);
        }
    }

    public record Response(
            String tipo,
            String titulo,
            List<String> colunas,
            List<LinkedHashMap<String, Object>> linhas,
            Map<String, Object> resumo,
            Filtro filtro,
            LocalDateTime geradoEm) {
    }

    public record TipoDisponivel(String tipo, String titulo, String descricao) {
    }
}
