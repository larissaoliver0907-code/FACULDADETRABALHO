package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.model.Relatavel;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Método-modelo para relatórios de entidades {@link Relatavel}: a classe base percorre a coleção
 * e pede a cada objeto o seu próprio {@code gerarRelatorio()}; as subclasses definem
 * quais entidades buscar, as colunas e o resumo.
 */
public abstract class RelatorioBase<T extends Relatavel> implements GeradorRelatorio {

    protected abstract List<T> buscar(RelatorioDTO.Filtro filtro);

    protected abstract List<String> colunas();

    /** Resumo opcional exibido acima da tabela. */
    protected Map<String, Object> resumo(List<T> entidades) {
        Map<String, Object> resumo = new LinkedHashMap<>();
        resumo.put("Total de registros", entidades.size());
        return resumo;
    }

    @Override
    public RelatorioDTO.Response gerarRelatorio(RelatorioDTO.Filtro filtro) {
        RelatorioDTO.Filtro f = filtro == null ? RelatorioDTO.Filtro.vazio() : filtro;
        List<T> entidades = buscar(f);
        List<LinkedHashMap<String, Object>> linhas = new ArrayList<>();
        for (T entidade : entidades) {
            linhas.add(entidade.gerarRelatorio());
        }
        return new RelatorioDTO.Response(getTipo(), getTitulo(), colunas(), linhas, resumo(entidades), f,
                LocalDateTime.now());
    }
}
