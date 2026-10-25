package com.educonnect.model;

import java.util.LinkedHashMap;

/**
 * Contrato polimórfico para entidades que sabem se descrever em um relatório.
 * Cada implementação devolve as colunas e os valores específicos da sua entidade,
 * mantendo a ordem de inserção (LinkedHashMap) para exportação em CSV e PDF.
 */
public interface Relatavel {

    LinkedHashMap<String, Object> gerarRelatorio();
}
