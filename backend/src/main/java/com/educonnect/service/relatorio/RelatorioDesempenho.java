package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.model.Aluno;
import com.educonnect.model.Avaliacao;
import com.educonnect.model.ConfiguracaoAcademica;
import com.educonnect.model.SituacaoAcademica;
import com.educonnect.model.Turma;
import com.educonnect.repository.AvaliacaoRepository;
import com.educonnect.service.ConfiguracaoService;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.educonnect.repository.Especificacoes.avaliacaoDaTurma;
import static com.educonnect.repository.Especificacoes.avaliacaoDoCurso;
import static com.educonnect.repository.Especificacoes.avaliacaoNoPeriodo;
import static com.educonnect.repository.Especificacoes.todas;

/**
 * Desempenho acadêmico por aluno e turma. Não estende {@link RelatorioBase} porque cada linha
 * agrega várias avaliações; ainda assim responde ao mesmo contrato polimórfico.
 */
@Component
public class RelatorioDesempenho implements GeradorRelatorio {

    private final AvaliacaoRepository repository;
    private final ConfiguracaoService configuracaoService;

    public RelatorioDesempenho(AvaliacaoRepository repository, ConfiguracaoService configuracaoService) {
        this.repository = repository;
        this.configuracaoService = configuracaoService;
    }

    @Override
    public String getTipo() {
        return "desempenho";
    }

    @Override
    public String getTitulo() {
        return "Desempenho acadêmico";
    }

    @Override
    public String getDescricao() {
        return "Média e situação de cada aluno por turma, segundo os critérios configurados.";
    }

    @Override
    public RelatorioDTO.Response gerarRelatorio(RelatorioDTO.Filtro filtro) {
        RelatorioDTO.Filtro f = filtro == null ? RelatorioDTO.Filtro.vazio() : filtro;
        ConfiguracaoAcademica config = configuracaoService.obter();
        List<Avaliacao> avaliacoes = repository.findAll(todas(avaliacaoDoCurso(f.cursoId()),
                avaliacaoDaTurma(f.turmaId()), avaliacaoNoPeriodo(f.inicio(), f.fim())), Sort.by("id"));

        // Agrupa por (turma, aluno) mantendo a ordem por turma e nome do aluno.
        Map<String, List<Avaliacao>> grupos = new LinkedHashMap<>();
        avaliacoes.stream()
                .sorted((a, b) -> {
                    int c = a.getTurma().getCodigo().compareTo(b.getTurma().getCodigo());
                    return c != 0 ? c : a.getAluno().getNome().compareToIgnoreCase(b.getAluno().getNome());
                })
                .forEach(av -> grupos.computeIfAbsent(av.getTurma().getId() + ":" + av.getAluno().getId(),
                        k -> new ArrayList<>()).add(av));

        List<LinkedHashMap<String, Object>> linhas = new ArrayList<>();
        Map<SituacaoAcademica, Integer> contagem = new EnumMap<>(SituacaoAcademica.class);
        for (List<Avaliacao> grupo : grupos.values()) {
            Aluno aluno = grupo.get(0).getAluno();
            Turma turma = grupo.get(0).getTurma();
            List<BigDecimal> notas = grupo.stream().map(Avaliacao::getNota).toList();
            SituacaoAcademica situacao = config.avaliarSituacao(notas);
            contagem.merge(situacao, 1, Integer::sum);

            LinkedHashMap<String, Object> linha = new LinkedHashMap<>();
            linha.put("Matrícula", aluno.getMatricula());
            linha.put("Aluno", aluno.getNome());
            linha.put("Turma", turma.getCodigo());
            linha.put("Avaliações", notas.size());
            linha.put("Média", ConfiguracaoAcademica.calcularMedia(notas));
            linha.put("Situação", situacao.getDescricao());
            linhas.add(linha);
        }

        Map<String, Object> resumo = new LinkedHashMap<>();
        resumo.put("Alunos avaliados (por turma)", linhas.size());
        resumo.put("Média de aprovação configurada",
                config.isCriterioConfigurado() ? config.getMediaMinimaAprovacao() : "Não configurada");
        contagem.forEach((situacao, total) -> resumo.put(situacao.getDescricao(), total));

        return new RelatorioDTO.Response(getTipo(), getTitulo(),
                List.of("Matrícula", "Aluno", "Turma", "Avaliações", "Média", "Situação"),
                linhas, resumo, f, LocalDateTime.now());
    }
}
