package com.educonnect.service;

import com.educonnect.dto.AlunoDTO;
import com.educonnect.dto.TurmaDTO;
import com.educonnect.model.Aluno;
import com.educonnect.model.Avaliacao;
import com.educonnect.model.ConfiguracaoAcademica;
import com.educonnect.model.SituacaoAcademica;
import com.educonnect.model.Turma;
import com.educonnect.repository.AvaliacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Cálculo de médias e situação acadêmica com base nos critérios configurados. */
@Service
public class DesempenhoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final ConfiguracaoService configuracaoService;

    public DesempenhoService(AvaliacaoRepository avaliacaoRepository, ConfiguracaoService configuracaoService) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.configuracaoService = configuracaoService;
    }

    /** Desempenho do aluno por turma (média e situação) e média geral de todas as avaliações. */
    @Transactional
    public AlunoDTO.Desempenho desempenhoDoAluno(Aluno aluno) {
        ConfiguracaoAcademica config = configuracaoService.obter();
        List<Avaliacao> historico = avaliacaoRepository.historicoDoAluno(aluno.getId());

        // Agrupa as notas por turma preservando a ordem de exibição.
        Map<Turma, List<BigDecimal>> notasPorTurma = new LinkedHashMap<>();
        List<BigDecimal> todasNotas = new ArrayList<>();
        historico.stream()
                .sorted(Comparator.comparing((Avaliacao a) -> a.getTurma().getCodigo()))
                .forEach(av -> {
                    notasPorTurma.computeIfAbsent(av.getTurma(), t -> new ArrayList<>()).add(av.getNota());
                    todasNotas.add(av.getNota());
                });
        // Turmas atuais sem avaliações também aparecem.
        for (Turma turma : aluno.getTurmas()) {
            notasPorTurma.putIfAbsent(turma, new ArrayList<>());
        }

        List<AlunoDTO.DesempenhoTurma> porTurma = new ArrayList<>();
        for (Map.Entry<Turma, List<BigDecimal>> entrada : notasPorTurma.entrySet()) {
            List<BigDecimal> notas = entrada.getValue();
            SituacaoAcademica situacao = config.avaliarSituacao(notas);
            porTurma.add(new AlunoDTO.DesempenhoTurma(
                    TurmaDTO.Resumo.de(entrada.getKey()),
                    notas.size(),
                    ConfiguracaoAcademica.calcularMedia(notas),
                    situacao,
                    situacao.getDescricao()));
        }
        return new AlunoDTO.Desempenho(AlunoDTO.Resumo.de(aluno), ConfiguracaoAcademica.calcularMedia(todasNotas),
                todasNotas.size(), config.isCriterioConfigurado(), porTurma);
    }

    /** Contagem de situações acadêmicas considerando cada par aluno/turma com avaliações. */
    @Transactional
    public Map<SituacaoAcademica, Long> distribuicaoSituacoes(List<Object[]> notasAlunoTurma) {
        ConfiguracaoAcademica config = configuracaoService.obter();
        Map<String, List<BigDecimal>> agrupado = new HashMap<>();
        for (Object[] linha : notasAlunoTurma) {
            String chave = linha[0] + ":" + linha[1];
            agrupado.computeIfAbsent(chave, k -> new ArrayList<>()).add((BigDecimal) linha[2]);
        }
        Map<SituacaoAcademica, Long> contagem = new EnumMap<>(SituacaoAcademica.class);
        for (List<BigDecimal> notas : agrupado.values()) {
            contagem.merge(config.avaliarSituacao(notas), 1L, Long::sum);
        }
        return contagem;
    }
}
