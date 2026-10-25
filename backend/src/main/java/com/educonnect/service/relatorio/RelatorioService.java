package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Seleciona o gerador pelo tipo e delega a geração (polimorfismo, sem switch). */
@Service
public class RelatorioService {

    private static final List<String> ORDEM = List.of("alunos", "professores", "cursos", "turmas", "notas", "desempenho");

    private final Map<String, GeradorRelatorio> geradores = new LinkedHashMap<>();

    public RelatorioService(List<GeradorRelatorio> implementacoes) {
        implementacoes.stream()
                .sorted((a, b) -> Integer.compare(posicao(a.getTipo()), posicao(b.getTipo())))
                .forEach(g -> geradores.put(g.getTipo(), g));
    }

    private static int posicao(String tipo) {
        int i = ORDEM.indexOf(tipo);
        return i < 0 ? Integer.MAX_VALUE : i;
    }

    public List<RelatorioDTO.TipoDisponivel> tiposDisponiveis() {
        return geradores.values().stream()
                .map(g -> new RelatorioDTO.TipoDisponivel(g.getTipo(), g.getTitulo(), g.getDescricao()))
                .toList();
    }

    @Transactional
    public RelatorioDTO.Response gerar(String tipo, RelatorioDTO.Filtro filtro) {
        if (filtro != null && filtro.inicio() != null && filtro.fim() != null && filtro.inicio().isAfter(filtro.fim())) {
            throw new RegraNegocioException("A data inicial do período deve ser anterior à data final.");
        }
        GeradorRelatorio gerador = geradores.get(tipo);
        if (gerador == null) {
            throw new RecursoNaoEncontradoException("Relatório", tipo);
        }
        return gerador.gerarRelatorio(filtro);
    }
}
