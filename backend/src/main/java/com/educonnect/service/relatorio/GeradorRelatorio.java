package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;

/**
 * Contrato polimórfico dos relatórios. Cada implementação conhece a sua entidade e devolve
 * colunas, linhas e resumo específicos; o {@link RelatorioService} escolhe o gerador pelo tipo
 * sem precisar de condicionais.
 */
public interface GeradorRelatorio {

    /** Identificador usado na URL, ex.: "alunos". */
    String getTipo();

    String getTitulo();

    String getDescricao();

    RelatorioDTO.Response gerarRelatorio(RelatorioDTO.Filtro filtro);
}
